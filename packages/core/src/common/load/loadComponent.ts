import fs from 'fs-extra';
import path from 'path';
import { S_ROOT_HOME_COMPONENT } from '../../libs/common';
import {
  buildComponentInstance,
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import { RegistryEnum, Registry } from '../constant';
import * as config from '../../libs/handler-set-config';
import { downloadRequest } from '../request';
import installDependency from '../installDependency';
import get from 'lodash.get';

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

async function loadServerless(source: string, params?: any) {
  if (!source.includes('/')) return null;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  let componentPath: string;
  if (version) {
    const result = await tryfun(getServerlessReleases(provider, name));
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
    componentPath = path.resolve(
      S_ROOT_HOME_COMPONENT,
      'serverlessfans.cn',
      provider,
      componentName,
    );
  } else {
    const result = await tryfun(getServerlessReleasesLatest(provider, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
    componentPath = path.resolve(
      S_ROOT_HOME_COMPONENT,
      'serverlessfans.cn',
      provider,
      `${componentName}@${result.tag_name}`,
    );
  }
  const lockPath = path.resolve(componentPath, '.s.lock');

  if (!fs.existsSync(lockPath)) {
    await downloadRequest(zipball_url, componentPath, {
      extract: true,
      strip: 1,
    });
    await installDependency({ cwd: componentPath, production: true });
    fs.writeFileSync(lockPath, zipball_url);
  }
  return await buildComponentInstance(componentPath, params);
}

async function loadGithub(source: string, params?: any) {
  if (!source.includes('/')) return;
  const [user, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  let componentPath: string;
  if (version) {
    const result = await tryfun(getGithubReleases(user, name));
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
    componentPath = path.resolve(S_ROOT_HOME_COMPONENT, 'github.com', user, componentName);
  } else {
    const result = await tryfun(getGithubReleasesLatest(user, name));
    if (!get(result, 'zipball_url')) return;
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
      strip: 1,
    });
    await installDependency({ cwd: componentPath, production: true });
    fs.writeFileSync(lockPath, zipball_url);
  }
  return await buildComponentInstance(componentPath, params);
}

async function loadType(source: string, registry?: Registry, params?: any) {
  if (registry === RegistryEnum.serverless) {
    return await loadServerless(source, params);
  }
  if (registry === RegistryEnum.github) {
    return await loadGithub(source, params);
  }
}

// TODO: 如何判断是一个组件
function isComponent(result) {
  return !!result;
}

async function loadRemoteComponent(oldsource: string, registry?: Registry, params?: any) {
  const source = oldsource.includes('/') ? oldsource : `devsapp/${oldsource}`;
  let result: any;
  // gui
  if ((process.versions as any).electron) {
    if (registry) {
      result = await loadType(source, registry, params);
      if (isComponent(result)) return result;
    }
    if (config.getConfig('registry')) {
      result = await loadType(source, config.getConfig('registry'), params);
      if (isComponent(result)) return result;
    }
    result = await loadServerless(source, params);
    if (isComponent(result)) return result;

    result = await loadGithub(source, params);
    if (isComponent(result)) return result;
  } else {
    // cli
    if (registry) {
      result = await loadType(source, registry, params);
      if (isComponent(result)) return result;
    }
    if (config.getConfig('registry')) {
      result = await loadType(source, config.getConfig('registry'), params);
      if (isComponent(result)) return result;
    }
    result = await loadGithub(source, params);
    if (isComponent(result)) return result;
    result = await loadServerless(source, params);
    if (isComponent(result)) return result;
  }

  if (!result) {
    throw new Error(`未找到${source}组件，请确定组件名或者源是否正确`);
  }
}

async function loadComponent(source: string, registry?: Registry, params?: any) {
  // 本地调试
  if (fs.existsSync(source)) {
    return await buildComponentInstance(source, params);
  }
  // js里引用下, 判断 registry 值是否 合法
  if (registry) {
    if (registry !== RegistryEnum.github && registry !== RegistryEnum.serverless) {
      throw new Error(
        `请检查registry的值，需设置为[${RegistryEnum.github}, ${RegistryEnum.serverless}]`,
      );
    }
  }
  return await loadRemoteComponent(source, registry, params);
}

export const load = loadComponent;

export default loadComponent;
