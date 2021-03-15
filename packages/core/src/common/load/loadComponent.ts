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
    componentPath = `${S_ROOT_HOME_COMPONENT}/github.com//${user}/${componentName}@${result.tag_name}`;
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

async function loadComponent(source: string, registry?: Registry) {
  // gui
  if ((process.versions as any).electron) {
    let result: any;
    if (registry) {
      result = await tryfun(loadType(source, registry));
      if (typeof result === 'function') return [result, null];
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, config.getConfig('registry')));
      if (typeof result === 'function') return [result, null];
    }
    result = await tryfun(loadServerless(source));
    if (typeof result === 'function') return [result, null];

    result = await tryfun(loadGithub(source));
    if (typeof result === 'function') return [result, null];
    return [null, new Error(`未找到${source}相关资源`)];
  } else {
    // cli
    let result: any;
    if (registry) {
      result = await tryfun(loadType(source, registry));
      if (typeof result === 'function') return [result, null];
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, config.getConfig('registry')));
      if (typeof result === 'function') return [result, null];
    }
    result = await tryfun(loadGithub(source));
    if (typeof result === 'function') return [result, null];
    result = await tryfun(loadServerless(source));
    if (typeof result === 'function') return [result, null];
    return [null, new Error(`未找到${source}相关资源`)];
  }
}

export const load = loadComponent;

export default loadComponent;
