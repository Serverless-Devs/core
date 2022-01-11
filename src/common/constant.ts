export type IRegistry =
  | 'http://registry.devsapp.cn/simple'
  | 'https://api.github.com/repos'
  | 'http://registry.serverlessfans.cn/simple';

export enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverlessOld = 'http://registry.serverlessfans.cn/simple',
  serverless = 'http://registry.devsapp.cn/simple',
}

export const DEFAULT_REGIRSTRY = 'http://registry.devsapp.cn/simple';
