import fs from 'fs-extra';
import { S_ROOT_HOME_COMPONENT, S_CURRENT } from '../../libs/common';
import {
  buildComponentInstance,
  downloadComponent,
  generateComponentPath,
  IComponentPath,
  installDependency,
} from './service';
import * as config from '../../libs/handler-set-config';
import got from 'got';
import { downloadRequest } from '../request';

type Registry = 'https://tool.serverlessfans.com/api' | 'https://api.github.com/repos';

enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverless = 'https://tool.serverlessfans.com/api',
}

async function loadServerless(source: string, storageDirectory: string) {
  const [provider, componentName] = source.split('/');
  const [name, version] = componentName.split('@');
  const baseArgs = { name, version, provider };
  const componentPaths: IComponentPath = await generateComponentPath(baseArgs, storageDirectory);
  const { componentPath, lockPath } = componentPaths;
  // 通过是否存在 .s.lock文件来判断
  if (!fs.existsSync(lockPath)) {
    await downloadComponent(componentPath, baseArgs);
    await installDependency(baseArgs.name, componentPaths);
  }
  return await buildComponentInstance(componentPath);
}

async function loadGithub(source: string, storageDirectory: string) {
  const filename = source.split('/')[1];
  if (fs.existsSync(`${storageDirectory}/${filename}`)) {
    return true;
  }
  const result: any = await got(`${RegistryEnum.github}/${source}/releases/latest`);
  if (result.body) {
    try {
      const { zipball_url } = JSON.parse(result.body);
      await downloadRequest(zipball_url, `${storageDirectory}/${filename}`, {
        extract: true,
        strip: 1,
      });
      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }
  return false;
}

export async function loadType(source: string, storageDirectory: string, registry?: Registry) {
  if (registry === RegistryEnum.serverless) {
    return await loadServerless(source, storageDirectory);
  }
  if (registry === RegistryEnum.github) {
    return await loadGithub(source, storageDirectory);
  }
}

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error
  }
}

export async function loadCommon(source: string, storageDirectory: string, registry?: Registry) {
  // gui
  if ((process.versions as any).electron) {
    let result: any;
    if (registry) {
      result = await tryfun(loadType(source, storageDirectory, registry));
      if (result) return result;
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, storageDirectory, config.getConfig('registry')));
      if (result) return result;
    }
    result = await tryfun(loadType(source, storageDirectory, RegistryEnum.serverless));
    if (result) return result;
    result = await tryfun(loadType(source, storageDirectory, RegistryEnum.github));
    if (result) return result;
    return `未找到${source}相关资源`;
  } else {
    // cli
    let result: any;
    if (registry) {
      result = await tryfun(loadType(source, storageDirectory, registry));
      if (result) return result;
    }
    if (config.getConfig('registry')) {
      result = await tryfun(loadType(source, storageDirectory, config.getConfig('registry')));
      if (result) return result;
    }
    result = await tryfun(loadType(source, storageDirectory, RegistryEnum.github));
    if (result) return result;
    result = await tryfun(loadType(source, storageDirectory, RegistryEnum.serverless));
    if (result) return result;
    return `未找到${source}相关资源`;
  }
}

export async function loadComponent(source: string, registry?: Registry) {
  return await loadCommon(source, S_ROOT_HOME_COMPONENT, registry);
}

export async function loadApplication(source: string, registry?: Registry) {
  return await loadCommon(source, S_CURRENT, registry);
}

export const load = loadComponent;

export default loadComponent;
