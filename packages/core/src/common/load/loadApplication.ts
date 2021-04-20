import { S_CURRENT } from '../../libs/common';
import {
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import { RegistryEnum } from '../constant';
import path from 'path';
import * as config from '../../libs/handler-set-config';
import { downloadRequest } from '../request';
import { spawnSync } from 'child_process';
import getYamlContent from '../getYamlContent';
import fs from 'fs-extra';
import inquirer from 'inquirer';

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

async function loadServerless(source: string, target?: string) {
  if (!source.includes('/')) return;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getServerlessReleases(provider, name));
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getServerlessReleasesLatest(provider, name));
    if (!result.zipball_url) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
    strip: 1,
  });
  return applicationPath;
}

async function loadGithub(source: string, target?: string) {
  if (!source.includes('/')) return;
  const [user, componentNameSubDir] = source.split('/');
  if (!componentNameSubDir) return;
  const [componentName, subDir] = componentNameSubDir.split(':');
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getGithubReleases(user, name));
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getGithubReleasesLatest(user, name));
    if (!result.zipball_url) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  if (subDir) {
    return handleSubDir({ zipball_url, target, subDir, applicationPath });
  }
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
    strip: 1,
  });
  return applicationPath;
}

async function handleSubDir({ zipball_url, target, subDir, applicationPath }) {
  const subDirPath = path.resolve(target, subDir);
  if (fs.existsSync(subDirPath)) {
    const res = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `文件 ${subDir} 已存在，是否覆盖该文件`,
        default: true,
      },
    ]);
    if (!res.confirm) return subDirPath;
  }
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
    strip: 1,
  });
  const originSubDirPath = getYamlContent(path.resolve(applicationPath, subDir, 'publish.yaml'))
    ? path.resolve(applicationPath, subDir, 'src')
    : path.resolve(applicationPath, subDir);
  spawnSync(
    `rm -rf ${subDirPath} && mv ${originSubDirPath} ${subDirPath} && rm -rf ${applicationPath}`,
    [],
    {
      shell: true,
    },
  );
  return subDirPath;
}

async function loadType(source: string, registry?: string, target?: string) {
  if (registry === RegistryEnum.serverless) {
    return await loadServerless(source, target);
  }
  if (registry === RegistryEnum.github) {
    return await loadGithub(source, target);
  }
}

async function loadApplicationByUrl(source: string, registry?: string, target?: string) {
  const applicationPath = path.resolve(target, source);
  await downloadRequest(registry, applicationPath, {
    postfix: 'zip',
    extract: true,
  });
  return applicationPath;
}

async function loadApplication(source: string, registry?: string, target?: string) {
  const targetPath = target || S_CURRENT;
  if (registry) {
    if (registry !== RegistryEnum.github && registry !== RegistryEnum.serverless) {
      // 支持 自定义
      return await loadApplicationByUrl(source, registry, targetPath);
    }
  }

  let appPath: string;
  // gui
  if ((process.versions as any).electron) {
    if (registry) {
      appPath = await loadType(source, registry, targetPath);
      if (appPath) return appPath;
    }
    if (config.getConfig('registry')) {
      appPath = await loadType(source, config.getConfig('registry'), targetPath);
      if (appPath) return appPath;
    }
    appPath = await loadServerless(source, targetPath);
    if (appPath) return appPath;
    return await loadGithub(source, targetPath);
  } else {
    // cli
    if (registry) {
      appPath = await loadType(source, registry, targetPath);
      if (appPath) return appPath;
    }
    if (config.getConfig('registry')) {
      appPath = await loadType(source, config.getConfig('registry'), targetPath);
      if (appPath) return appPath;
    }
    appPath = await loadGithub(source, targetPath);
    if (appPath) return appPath;
    return await loadServerless(source, targetPath);
  }
}

export default loadApplication;
