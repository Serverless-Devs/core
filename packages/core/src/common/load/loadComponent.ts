import fs from 'fs-extra';

import { S_ROOT_HOME_COMPONENT } from '../../libs/common';
import {
  buildComponentInstance,
  downloadComponent,
  generateComponentPath,
  IComponentPath,
  installDependency,
  RegistryEnum,
  Registry,
  getGithubReleases,
  getGithubReleasesLatest,
} from './service';
import * as config from '../../libs/handler-set-config';
import { downloadRequest } from '../request';
import { Logger } from '../../logger';

async function loadServerless(source: string) {
  if (!source.includes('/')) return;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  const baseArgs = { name, version, provider };
  const componentPaths: IComponentPath = await generateComponentPath(
    baseArgs,
    `${S_ROOT_HOME_COMPONENT}/serverlessfans.com`,
  );
  const { componentPath, lockPath } = componentPaths;
  // 通过是否存在 .s.lock文件来判断
  if (!fs.existsSync(lockPath)) {
    await downloadComponent(componentPath, baseArgs);
    await installDependency(baseArgs.name, componentPaths);
  }
  return await buildComponentInstance(componentPath);
}

async function loadGithub(source: string) {
  if (!source.includes('/')) return;
  const [user, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  let componentPath: string;
  if (version) {
    const result = await getGithubReleases(user, name);
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
    componentPath = `${S_ROOT_HOME_COMPONENT}/github.com/${user}/${componentName}`;
  } else {
    const result = await getGithubReleasesLatest(user, name);
    zipball_url = result.zipball_url;
    componentPath = `${S_ROOT_HOME_COMPONENT}/github.com/${user}/${componentName}@${result.tag_name}`;
  }
  const lockPath = `${componentPath}/.s.lock`;
  if (!fs.existsSync(lockPath)) {
    await downloadRequest(zipball_url, componentPath, {
      extract: true,
      strip: 1,
    });
    fs.writeFileSync(lockPath, zipball_url);
  }
  return await buildComponentInstance(componentPath);
}

async function loadType(source: string, registry?: Registry) {
  if (registry === RegistryEnum.serverless) {
    return await loadServerless(source);
  }
  if (registry === RegistryEnum.github) {
    return await loadGithub(source);
  }
}

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error
  }
}

// TODO: 如何判断是一个组件
function isComponent(result) {
  return !!result;
}

async function loadRemoteComponent(source: string, registry?: Registry) {
  let result: any;
  // gui
  if ((process.versions as any).electron) {
    if (registry) {
      result = await tryfun(loadType(source, registry));
      if (isComponent(result)) return result;
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, config.getConfig('registry')));
      if (isComponent(result)) return result;
    }
    result = await tryfun(loadServerless(source));
    if (isComponent(result)) return result;

    result = await tryfun(loadGithub(source));
    if (isComponent(result)) return result;
  } else {
    // cli
    if (registry) {
      result = await tryfun(loadType(source, registry));
      if (isComponent(result)) return result;
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, config.getConfig('registry')));
      if (isComponent(result)) return result;
    }
    result = await tryfun(loadGithub(source));
    if (isComponent(result)) return result;
    result = await tryfun(loadServerless(source));
    if (isComponent(result)) return result;
  }
  const logger = new Logger();
  // TODO: `下载的${source}的资源中，未找到相关组件`
  logger.warn(`未找到${source}相关资源`);
  return null;
}

async function loadComponent(source: string, registry?: Registry) {
  // 本地调试
  if (fs.existsSync(source)) {
    return await buildComponentInstance(source);
  } else {
    return await loadRemoteComponent(source, registry);
  }
}

export const load = loadComponent;

export default loadComponent;
