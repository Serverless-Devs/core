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
import getYamlContent from '../getYamlContent';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import get from 'lodash.get';
import rimraf from 'rimraf';
import installDependency from '../installDependency';

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

function isGitSource(source: string) {
  return source.includes('/') && source.includes(':');
}

async function loadServerless(oldsource: string, target?: string) {
  let source: string;
  if (isGitSource(oldsource)) {
    const [a, b] = oldsource.split(':');
    const [c] = a.split('/');
    source = `${c}/${b}`;
  } else {
    source = oldsource.includes('/') ? oldsource : `./${oldsource}`;
  }

  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getServerlessReleases(provider, name));
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getServerlessReleasesLatest(provider, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  return handleDecompressFile({ zipball_url, applicationPath, name });
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
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getGithubReleasesLatest(user, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  if (subDir) {
    return handleSubDir({ zipball_url, target, subDir, applicationPath });
  }
  return handleDecompressFile({ zipball_url, applicationPath, name });
}
async function handleDecompressFile({ zipball_url, applicationPath, name }) {
  const answer = await checkFileExists(applicationPath, name);
  if (!answer) return applicationPath;
  rimraf.sync(applicationPath);
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
    strip: 1,
  });
  const hasPublishYaml = await getYamlContent(path.resolve(applicationPath, 'publish.yaml'));
  if (hasPublishYaml) {
    const temporaryPath = `${applicationPath}${new Date().getTime()}`;
    fs.moveSync(`${applicationPath}/src`, temporaryPath);
    rimraf.sync(applicationPath);
    fs.renameSync(temporaryPath, applicationPath);
  }
  await needInstallDependency(applicationPath);
  return applicationPath;
}

async function needInstallDependency(cwd: string) {
  const res = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to install dependencies?',
      default: true,
    },
  ]);
  if (res.confirm) {
    await tryfun(installDependency({ cwd, production: false }));
  }
}

async function checkFileExists(filePath: string, fileName: string) {
  if (fs.existsSync(filePath)) {
    const res = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `文件 ${fileName} 已存在，是否覆盖该文件`,
        default: true,
      },
    ]);
    return res.confirm;
  }
  // 不存在文件，返回true表示需要覆盖
  return true;
}
async function handleSubDir({ zipball_url, target, subDir, applicationPath }) {
  const subDirPath = path.resolve(target, subDir);
  const answer = await checkFileExists(subDirPath, subDir);
  if (!answer) return subDirPath;
  rimraf.sync(subDirPath);
  const temporaryPath = `${applicationPath}${new Date().getTime()}`;
  await downloadRequest(zipball_url, temporaryPath, {
    extract: true,
    strip: 1,
  });
  const originSubDirPath = (await getYamlContent(
    path.resolve(temporaryPath, subDir, 'publish.yaml'),
  ))
    ? path.resolve(temporaryPath, subDir, 'src')
    : path.resolve(temporaryPath, subDir);

  fs.moveSync(originSubDirPath, subDirPath);
  rimraf.sync(temporaryPath);
  await needInstallDependency(subDirPath);
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
  appPath = await loadGithub(source, targetPath);
  if (appPath) return appPath;

  if (!appPath) {
    throw new Error(`未找到${source}应用，请确定应用名或者源是否正确`);
  }
}

export default loadApplication;
