import request from '../request';
import { readJsonFile } from '../../libs/utils';
import path from 'path';
import fs from 'fs-extra';
import { get } from 'lodash';
import { RegistryEnum } from '../constant';

export const buildComponentInstance = async (componentPath: string, params?: any) => {
  let index: string;
  const fsStat = await fs.stat(componentPath);
  if (fsStat.isDirectory()) {
    const packageInfo: any = readJsonFile(path.resolve(componentPath, 'package.json'));
    // 首先寻找 package.json 文件下的 main
    index = get(packageInfo, 'main');
    // 其次检查 tsconfig.json 文件下的 outDir
    if (!index) {
      const tsconfigPath = path.resolve(componentPath, 'tsconfig.json');
      const tsconfigInfo = readJsonFile(tsconfigPath);
      index = get(tsconfigInfo, 'compilerOptions.outDir');
    }

    // 其次寻找 src/index.js
    if (!index) {
      const srcIndexPath = path.resolve(componentPath, './src/index.js');
      if (fs.existsSync(srcIndexPath)) {
        index = './src/index.js';
      }
    }

    // 最后寻找 ./index.js
    if (!index) {
      const indexPath = path.resolve(componentPath, './index.js');
      if (fs.existsSync(indexPath)) {
        index = './index.js';
      }
    }
    if (!index) {
      throw new Error(
        'require不到组件, 请检查组件入口文件的设置是否设正确, 在当前目录下 首先寻找 package.json 文件下的 main, 其次寻找 tsconfig.json 文件下的 compilerOptions.outDir, 其次寻找 src/index.js, 最后寻找 index.js',
      );
    }
  }

  const requirePath = fsStat.isFile() ? componentPath : path.resolve(componentPath, index);
  const baseChildComponent = await require(requirePath);

  const ChildComponent = baseChildComponent.default
    ? baseChildComponent.default
    : baseChildComponent;
  const componentInstance = new ChildComponent(params);
  if (componentInstance) {
    componentInstance.__path = componentPath;
  }
  return componentInstance;
};

export const getGithubReleases = async (user: string, name: string) => {
  return await request(`${RegistryEnum.github}/${user}/${name}/releases`, { ignoreError: true });
};

export const getGithubReleasesLatest = async (user: string, name: string) => {
  return await request(`${RegistryEnum.github}/${user}/${name}/releases/latest`, {
    ignoreError: true,
  });
};

export const getServerlessReleases = async (provider: string, name: string) => {
  const url =
    provider === '.'
      ? `${RegistryEnum.serverless}/${name}/releases`
      : `${RegistryEnum.serverless}/${provider}/${name}/releases`;
  return await request(url, {
    ignoreError: true,
  });
};

export const getServerlessReleasesLatest = async (provider: string, name: string) => {
  const url =
    provider === '.'
      ? `${RegistryEnum.serverless}/${name}/releases/latest`
      : `${RegistryEnum.serverless}/${provider}/${name}/releases/latest`;
  return await request(url);
};
