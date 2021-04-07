import fs from 'fs-extra';
import path from 'path';
import { S_ROOT_HOME_COMPONENT } from '../../libs/common';
import {
  buildComponentInstance,
  RegistryEnum,
  Registry,
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import * as config from '../../libs/handler-set-config';
import { downloadRequest } from '../request';
import { Logger } from '../../logger';
import installDependency from '../installDependency';

async function loadServerless(source: string) {
  const [name, version] = source.split('@');
  let zipball_url: string;
  let componentPath: string;
  if (version) {
    const result = await getServerlessReleases(name);
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
    componentPath = path.resolve(S_ROOT_HOME_COMPONENT, 'serverlessfans.cn', source);
  } else {
    const result = await getServerlessReleasesLatest(name);
    zipball_url = result.zipball_url;
    componentPath = path.resolve(
      S_ROOT_HOME_COMPONENT,
      'serverlessfans.cn',
      `${source}@${result.tag_name}`,
    );
  }
  const lockPath = path.resolve(componentPath, '.s.lock');

  if (!fs.existsSync(lockPath)) {
    await downloadRequest(zipball_url, componentPath, {
      extract: true,
    });
    await installDependency({ cwd: componentPath, production: true });
    fs.writeFileSync(lockPath, zipball_url);
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
    componentPath = path.resolve(S_ROOT_HOME_COMPONENT, 'github.com', user, componentName);
  } else {
    const result = await getGithubReleasesLatest(user, name);
    zipball_url = result.zipball_url;
    componentPath = path.resolve(
      S_ROOT_HOME_COMPONENT,
      'github.com',
      user,
      `${componentName}@${result.tag_name}`,
    );
  }
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (!fs.existsSync(lockPath)) {
    await downloadRequest(zipball_url, componentPath, {
      extract: true,
    });
    await installDependency({ cwd: componentPath, production: true });
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
  }
  // js里引用下, 判断 registry 值是否 合法
  if (registry) {
    if (registry !== RegistryEnum.github && registry !== RegistryEnum.serverless) {
      throw new Error(
        `请检查registry的值，需设置为[${RegistryEnum.github}, ${RegistryEnum.serverless}]`,
      );
    }
  }
  return await loadRemoteComponent(source, registry);
}

export const load = loadComponent;

export default loadComponent;
