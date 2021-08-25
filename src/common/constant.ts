export type Registry =
  | 'https://registry.devsapp.cn/simple'
  | 'https://api.github.com/repos'
  | 'http://registry.serverlessfans.cn/simple';

export enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverlessOld = 'http://registry.serverlessfans.cn/simple',
  serverless = 'https://registry.devsapp.cn/simple',
}
