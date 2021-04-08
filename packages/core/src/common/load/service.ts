import { request } from '../request';
import { readJsonFile } from '../../libs/utils';
import path from 'path';
import fs from 'fs';
import get from 'lodash.get';
import { RegistryEnum } from '../constant';

export const buildComponentInstance = async (componentPath: string, params?: any) => {
  let index: string;
  const packageInfo: any = readJsonFile(path.resolve(componentPath, 'package.json'));
  // 首先寻找 package.json 文件下的 main
  if (packageInfo.main) {
    index = packageInfo.main;
  }
  // 其次检查 tsconfig.json 文件下的 outDir
  if (!index) {
    const tsconfigPath = path.resolve(componentPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfigInfo: any = readJsonFile(tsconfigPath);
      index = get(tsconfigInfo, 'compilerOptions.outDir');
    }
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
  if (!index) return;

  let baseChildComponent: any;
  try {
    baseChildComponent = await require(path.resolve(componentPath, index));
  } catch (error) {
    console.error(error);
  }

  const ChildComponent = baseChildComponent.default
    ? baseChildComponent.default
    : baseChildComponent;

  return new ChildComponent(params);
};

export const getGithubReleases = async (user: string, name: string) => {
  return await request(`${RegistryEnum.github}/${user}/${name}/releases`);
};

export const getGithubReleasesLatest = async (user: string, name: string) => {
  return await request(`${RegistryEnum.github}/${user}/${name}/releases/latest`);
};

export const getServerlessReleases = async (name: string) => {
  return await request(`${RegistryEnum.serverless}/${name}/releases`);
};

export const getServerlessReleasesLatest = async (name: string) => {
  return await request(`${RegistryEnum.serverless}/${name}/releases/latest`);
};
