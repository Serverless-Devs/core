import fs from 'fs-extra';
import path from 'path';
import { getSComponentPath, getSetConfig } from '../../libs';
import {
  buildComponentInstance,
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import { RegistryEnum, IRegistry, FC_COMPONENT } from '../constant';
import { getComponentVersion } from './utils';
import downloadRequest from '../downloadRequest';
import installDependency from '../installDependency';
import { get, find, isEmpty } from 'lodash';
import { downLoadDesCore } from './loadDevsCore';
import { execDaemonWithTTL } from '../../execDaemon';
import { tryfun } from '../../libs';

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

function getProviderComponent(source: string) {
  if (source.includes('/')) {
    return source.split('/');
  }
  const isFcComponent = find(FC_COMPONENT, (o) => o === source);
  return isFcComponent ? ['devsapp', source] : ['.', source];
}

async function loadServerless(source: string, params?: any) {
  const [provider, componentName] = getProviderComponent(source);
  if (!componentName) return;
  const [name, version] = await getComponentVersion(provider, componentName);
  let componentPath: string;
  if (version) {
    const formatComponentName = `${name}@${version}`;
    const filename =
      provider === '.' ? `${formatComponentName}.zip` : `${provider}_${formatComponentName}.zip`;
    componentPath = await loadServerlessWithVersion({
      provider,
      name,
      componentName: formatComponentName,
      version,
      filename,
    });
  } else {
    const filename = provider === '.' ? `${name}.zip` : `${provider}_${name}.zip`;
    componentPath = await loadServerlessWithNoVersion({ provider, name, componentName, filename });
  }
  if (!componentPath) return;
  await downLoadDesCore(componentPath);
  return await buildComponentInstance(componentPath, params);
}

async function loadServerlessWithVersion({ provider, name, componentName, version, filename }) {
  const componentPath = path.join(getSComponentPath(), 'devsapp.cn', provider, componentName);
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (fs.existsSync(lockPath)) {
    return componentPath;
  }
  const result = await tryfun(getServerlessReleases, provider, name);
  if (!result) return;
  const findObj = result.find((item) => item.tag_name === version);
  if (!findObj) return;
  const { zipball_url } = findObj;
  await downloadComponent({ zipball_url, filename, componentPath, lockPath, version });
  return componentPath;
}

async function loadServerlessWithNoVersion({ provider, name, componentName, filename }) {
  const componentPath = path.join(getSComponentPath(), 'devsapp.cn', provider, componentName);
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (fs.existsSync(lockPath)) {
    execDaemonWithTTL('loadComponent.js', {
      componentPath,
      provider,
      name,
      lockPath,
      registry: RegistryEnum.serverless,
    });
    return componentPath;
  }
  const result = await tryfun(getServerlessReleasesLatest, provider, name);
  if (!get(result, 'zipball_url')) return;
  const { zipball_url, tag_name } = result;
  await downloadComponent({ zipball_url, filename, componentPath, lockPath, version: tag_name });
  return componentPath;
}

async function downloadComponent({ zipball_url, filename, componentPath, lockPath, version }) {
  await downloadRequest(zipball_url, componentPath, {
    filename,
    extract: true,
    strip: 1,
  });
  await preInit({ componentPath });
  await installDependency({ cwd: componentPath, production: true });
  fs.writeFileSync(lockPath, JSON.stringify({ version }, null, 2));
  await postInit({ componentPath });
}

async function loadGithub(source: string, params?: any) {
  if (!source.includes('/')) return;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = await getComponentVersion(provider, componentName);
  let componentPath: string;
  if (version) {
    componentPath = await loadGithubWithVersion({
      provider,
      name,
      componentName: `${name}@${version}`,
      version,
    });
  } else {
    componentPath = await loadGithubWithNoVersion({ provider, name, componentName });
  }
  if (!componentPath) return;
  await downLoadDesCore(componentPath);
  return await buildComponentInstance(componentPath, params);
}

async function loadGithubWithVersion({ provider, name, componentName, version }) {
  const componentPath = path.join(getSComponentPath(), 'github.com', provider, componentName);
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (fs.existsSync(lockPath)) {
    return componentPath;
  }
  const result = await tryfun(getGithubReleases, provider, name);
  if (!result) return;
  const findObj = result.find((item) => item.tag_name === version);
  if (!findObj) return;
  const { zipball_url } = findObj;
  const filename = `${provider}_${componentName}.zip`;
  await downloadComponent({ zipball_url, filename, componentPath, lockPath, version });
  return componentPath;
}

async function loadGithubWithNoVersion({ provider, name, componentName }) {
  const componentPath = path.join(getSComponentPath(), 'github.com', provider, componentName);
  const lockPath = path.resolve(componentPath, '.s.lock');
  if (fs.existsSync(lockPath)) {
    execDaemonWithTTL('loadComponent.js', {
      componentPath,
      provider,
      name,
      lockPath,
      registry: RegistryEnum.github,
    });
    return componentPath;
  }
  const result = await tryfun(getGithubReleasesLatest, provider, name);
  if (!get(result, 'zipball_url')) return;
  let { zipball_url, tag_name } = result;
  // dev的tag有问题的，github下载地址重置
  if (zipball_url.lastIndexOf('/dev') > 0) {
    zipball_url = zipball_url
      .replace(/^https:\/\/api.github.com/, 'https://github.com')
      .replace('repos/', '')
      .replace(/\/dev$/, '/refs/tags/dev');
  }
  const filename = `${provider}_${componentName}@${tag_name}.zip`;
  await downloadComponent({ zipball_url, filename, componentPath, lockPath, version: tag_name });
  return componentPath;
}

async function loadType(source: string, registry?: IRegistry, params?: any) {
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

async function loadRemoteComponent(source: string, registry?: IRegistry, params?: any) {
  let result: any;
  if (registry) {
    result = await loadType(source, registry, params);
    if (isComponent(result)) return result;
  }
  const registryFromSetConfig = await getSetConfig('registry');

  if (registryFromSetConfig) {
    result = await loadType(source, registryFromSetConfig, params);
    if (isComponent(result)) return result;
  }
  if (
    registryFromSetConfig !== RegistryEnum.serverless &&
    registryFromSetConfig !== RegistryEnum.serverlessOld
  ) {
    result = await loadServerless(source, params);
    if (isComponent(result)) return result;
  }

  if (registryFromSetConfig !== RegistryEnum.github) {
    result = await loadGithub(source, params);
    if (isComponent(result)) return result;
  }

  if (!result) {
    throw new Error(
      `The ${source} component was not found. Please make sure the component name or source is correct`,
    );
  }
}

async function loadComponent(source: string, registry?: IRegistry, params?: any) {
  if (isEmpty(source)) {
    throw new Error('Please check the value of source in loadComponent function.');
  }
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
