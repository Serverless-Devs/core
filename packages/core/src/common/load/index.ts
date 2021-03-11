import fs from 'fs-extra';
import { S_ROOT_HOME_COMPONENT } from '../../libs/common';
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
import spinner from '../spinner';
import decompress from 'decompress';
import i18n from '../../libs/i18n';

type Registry = 'https://tool.serverlessfans.com/api' | 'https://api.github.com/repos';

enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverless = 'https://tool.serverlessfans.com/api',
}

async function loadServerless(source: string) {
  const [provider, componentName] = source.split('/');
  const [name, version] = componentName.split('@');
  const baseArgs = { name, version, provider };
  const componentPaths: IComponentPath = await generateComponentPath(
    baseArgs,
    S_ROOT_HOME_COMPONENT,
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
  const result: any = await got(`${RegistryEnum.github}/${source}/releases/latest`);
  if (result.body) {
    try {
      const { zipball_url, tag_name } = JSON.parse(result.body);
      await downloadRequest(zipball_url, S_ROOT_HOME_COMPONENT);
      const files = fs.readdirSync(S_ROOT_HOME_COMPONENT);
      const [user, name] = source.split('/');
      const filename = files.find((item) => item.includes(`${user}-${name}-${tag_name}`));
      const vm = spinner(i18n.__('File unzipping...'));
      await decompress(`${S_ROOT_HOME_COMPONENT}/${filename}`, `${S_ROOT_HOME_COMPONENT}/${name}`, {
        strip: 1,
      });
      await fs.unlink(`${S_ROOT_HOME_COMPONENT}/${filename}`);
      vm.succeed(i18n.__('File decompression completed'));
    } catch (e) {
      throw new Error(e.message);
    }
  }
}

export async function loadComponent(source: string, registry?: Registry) {
  // gui
  if ((process.versions as any).electron) {
    // TODO
  } else {
    // cli
    const usedRegistry = registry || config.getConfig('registry') || RegistryEnum.github;
    if (usedRegistry === RegistryEnum.serverless) {
      return await loadServerless(source);
    }
    if (usedRegistry === RegistryEnum.github) {
      return await loadGithub(source);
    }
  }
}

export const load = loadComponent;

export default loadComponent;
