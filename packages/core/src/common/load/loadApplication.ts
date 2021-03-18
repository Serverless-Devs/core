import { S_CURRENT } from '../../libs/common';
import {
  downloadComponent,
  generateComponentPath,
  IComponentPath,
  installAppDependency,
  RegistryEnum,
  Registry,
  getGithubReleases,
  getGithubReleasesLatest,
} from './service';
import path from 'path';
import * as config from '../../libs/handler-set-config';
import { downloadRequest } from '../request';

async function loadServerless(source: string, target?: string) {
  if (!source.includes('/')) return;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  const baseArgs = { name, version, provider };
  const componentPaths: IComponentPath = await generateComponentPath(baseArgs, target);
  const { applicationPath } = componentPaths;
  await downloadComponent(applicationPath, { name, provider });
  await installAppDependency(applicationPath);
  return applicationPath;
}

async function loadGithub(source: string, target?: string) {
  if (!source.includes('/')) return;
  const [user, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await getGithubReleases(user, name);
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await getGithubReleasesLatest(user, name);
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(target, name);
  await downloadRequest(zipball_url, applicationPath, {
    extract: true,
    strip: 1,
  });
  await installAppDependency(applicationPath);
  return applicationPath;
}

async function loadType(source: string, registry?: Registry, target?: string) {
  if (registry === RegistryEnum.serverless) {
    return await loadServerless(source, target);
  }
  if (registry === RegistryEnum.github) {
    return await loadGithub(source, target);
  }
}

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error
  }
}

async function loadApplication(source: string, registry?: Registry, target?: string) {
  const targetPath = target || S_CURRENT;
  let appPath: string;
  // gui
  if ((process.versions as any).electron) {
    if (registry) {
      appPath = await tryfun(loadType(source, registry, targetPath));
      if (appPath) return appPath;
    }
    if (config.getConfig('registry')) {
      appPath = await tryfun(loadType(source, config.getConfig('registry'), targetPath));
      if (appPath) return appPath;
    }
    appPath = await tryfun(loadServerless(source, targetPath));
    if (appPath) return appPath;
    return await tryfun(loadGithub(source, targetPath));
  } else {
    // cli
    if (registry) {
      appPath = await tryfun(loadType(source, registry, targetPath));
      if (appPath) return appPath;
    }
    if (config.getConfig('registry')) {
      appPath = await tryfun(loadType(source, config.getConfig('registry'), targetPath));
      if (appPath) return appPath;
    }
    appPath = await tryfun(loadGithub(source, targetPath));
    if (appPath) return appPath;
    return await tryfun(loadServerless(source, targetPath));
  }
}

export default loadApplication;
