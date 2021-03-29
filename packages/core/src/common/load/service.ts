import fs from 'fs-extra';
import path from 'path';
import got from 'got';

import { spinner, request } from '../index';

const { spawnSync } = require('child_process');

export interface IComponentPath {
  componentVersion: string;
  applicationPath?: string;
  componentPath: string;
  lockPath: string;
}

export type Registry = 'http://registry.serverlessfans.cn/simple' | 'https://api.github.com/repos';

export enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverless = 'http://registry.serverlessfans.cn/simple',
}

export const installDependency = async (
  name: string,
  { componentPath, componentVersion, lockPath }: IComponentPath,
) => {
  const existPackageJson = fs.existsSync(path.resolve(componentPath, 'package.json'));
  if (existPackageJson) {
    const spin = spinner('Installing dependencies in serverless-devs core ...');
    const result = await spawnSync(
      'npm install --production --registry=https://registry.npm.taobao.org',
      [],
      {
        cwd: componentPath,
        stdio: process.env?.temp_params?.includes('--verbose') ? 'inherit' : 'ignore',
        shell: true,
      },
    );
    spin.succeed();
    if (result && result.status !== 0) {
      throw Error('> Execute Error');
    }
  }

  await fs.writeFileSync(lockPath, `${name}-${componentVersion}`);
};

export const installAppDependency = async (applicationPath: string) => {
  const existPackageJson = fs.existsSync(path.resolve(applicationPath, 'package.json'));
  if (existPackageJson) {
    const spin = spinner('Installing dependencies in serverless-devs core ...');
    const result = await spawnSync('npm install --registry=https://registry.npm.taobao.org', [], {
      cwd: applicationPath,
      stdio: process.env?.temp_params?.includes('--verbose') ? 'inherit' : 'ignore',
      shell: true,
    });
    spin.succeed();
    if (result && result.status !== 0) {
      throw Error('> Execute Error');
    }
  }
};

export const buildComponentInstance = async (componentPath: string) => {
  // const requiredComponentPath =
  //   componentPath.lastIndexOf('index') > -1 ? componentPath : path.join(componentPath, 'index');
  const baseChildComponent = await require(componentPath);
  const ChildComponent = baseChildComponent.default
    ? baseChildComponent.default
    : baseChildComponent;
  return new ChildComponent();
};

export const getGithubReleases = async (user: string, name: string) => {
  const result: any = await got(`${RegistryEnum.github}/${user}/${name}/releases`);
  return JSON.parse(result.body);
};

export const getGithubReleasesLatest = async (user: string, name: string) => {
  const result: any = await got(`${RegistryEnum.github}/${user}/${name}/releases/latest`);
  return JSON.parse(result.body);
};

export const getServerlessReleases = async (name: string) => {
  const result: any = await request(`${RegistryEnum.serverless}/${name}/releases`);
  return result;
};

export const getServerlessReleasesLatest = async (name: string) => {
  const result: any = await request(`${RegistryEnum.serverless}/${name}/releases/latest`);
  return result;
};
