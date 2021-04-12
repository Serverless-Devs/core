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
import installDependency from '../installDependency';

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

async function loadServerless(source: string, target?: string) {
  const [name, version] = source.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getServerlessReleases(name));
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getServerlessReleasesLatest(name));
    if (!result.zipball_url) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
  });
  await installDependency({ cwd: applicationPath });
  return applicationPath;
}

async function loadGithub(source: string, target?: string) {
  if (!source.includes('/')) return;
  const [user, componentName] = source.split('/');
  if (!componentName) return;
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
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
  });
  await installDependency({ cwd: applicationPath });
  return applicationPath;
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
  await installDependency({ cwd: applicationPath });
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
