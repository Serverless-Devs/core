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
import { removeDevsCore, downLoadDesCore } from '../../loadDevsCore';

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

async function preInit({ componentPath }) {
  try {
    const baseChildComponent = await require(path.join(componentPath, 'hook'));
    await baseChildComponent.preInit({ componentPath });
  } catch (e) {}
}

async function postInit({ componentPath }) {
  try {
    const baseChildComponent = await require(path.join(componentPath, 'hook'));
    await baseChildComponent.postInit({ componentPath });
  } catch (e) {}
}

async function loadServerless(source: string, params?: any) {
  const [provider, componentName] = source.includes('/') ? source.split('/') : ['.', source];
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
    componentPath = path.resolve(S_ROOT_HOME_COMPONENT, 'devsapp.cn', provider, componentName);
  } else {
    const result = await tryfun(getServerlessReleasesLatest(provider, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
    componentPath = path.resolve(
      S_ROOT_HOME_COMPONENT,
      'devsapp.cn',
      provider,
      `${componentName}@${result.tag_name}`,
    );
  }
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (!fs.existsSync(lockPath)) {
    await downloadRequest(zipball_url, componentPath, {
      extract: true,
      strip: 1,
      emptyDir: true,
    });
    await preInit({ componentPath });
    removeDevsCore(componentPath);
    await installDependency({ cwd: componentPath, production: true });
    fs.writeFileSync(lockPath, zipball_url);
    await postInit({ componentPath });
  } else {
    removeDevsCore(componentPath);
  }
  await downLoadDesCore(componentPath);
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
      emptyDir: true,
    });
    await preInit({ componentPath });
    removeDevsCore(componentPath);
    await installDependency({ cwd: componentPath, production: true });
    fs.writeFileSync(lockPath, zipball_url);
    await postInit({ componentPath });
  } else {
    removeDevsCore(componentPath);
  }
  await downLoadDesCore(componentPath);
  return await buildComponentInstance(componentPath, params);
}

async function loadType(source: string, registry?: Registry, params?: any) {
  if (registry === RegistryEnum.serverless || registry === RegistryEnum.serverlessOld) {
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

async function loadRemoteComponent(source: string, registry?: Registry, params?: any) {
  let result: any;
  if (registry) {
    result = await loadType(source, registry, params);
    if (isComponent(result)) return result;
  }
  if (config.getConfig('registry')) {
    result = await loadType(source, config.getConfig('registry'), params);
    if (isComponent(result)) return result;
  }
  if (
    config.getConfig('registry') !== RegistryEnum.serverless &&
    config.getConfig('registry') !== RegistryEnum.serverlessOld
  ) {
    result = await loadServerless(source, params);
    if (isComponent(result)) return result;
  }

  if (config.getConfig('registry') !== RegistryEnum.github) {
    result = await loadGithub(source, params);
    if (isComponent(result)) return result;
  }

  if (!result) {
    throw new Error(
      `The ${source} component was not found. Please make sure the component name or source is correct`,
    );
  }
}

async function loadComponent(source: string, registry?: Registry, params?: any) {
  // 本地调试
  if (fs.existsSync(source)) {
    return await buildComponentInstance(source, params);
  }
  // js里引用下, 判断 registry 值是否 合法
  if (registry) {
    if (
      registry !== RegistryEnum.github &&
      registry !== RegistryEnum.serverless &&
      registry !== RegistryEnum.serverlessOld
    ) {
      throw new Error(
        `Please check the value of registry and set it to [${RegistryEnum.github}, ${RegistryEnum.serverless}]`,
      );
    }
  }
  return await loadRemoteComponent(source, registry, params);
}

export const load = loadComponent;

export default loadComponent;
