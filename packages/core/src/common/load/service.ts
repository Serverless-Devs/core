import { request } from '../request';

export type Registry = 'http://registry.serverlessfans.cn/simple' | 'https://api.github.com/repos';

export enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverless = 'http://registry.serverlessfans.cn/simple',
}

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
  return await request(`${RegistryEnum.github}/${user}/${name}/releases`);
};

export const getGithubReleasesLatest = async (user: string, name: string) => {
  return await request(`${RegistryEnum.github}/${user}/${name}/releases/latest`);
};

export const getServerlessReleases = async (name: string) => {
  const result: any = await request(`${RegistryEnum.serverless}/${name}/releases`);
  return result;
};

export const getServerlessReleasesLatest = async (name: string) => {
  const result: any = await request(`${RegistryEnum.serverless}/${name}/releases/latest`);
  return result;
};
