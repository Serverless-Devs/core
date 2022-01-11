export interface IProjectConfig {
  component: string;
  props: object;
  access: string;
  provider: string;
  appName: string;
  serviceName: string;
  credentials?: ICredentials;
  actions?: object;
}

export interface ICredentials {
  AccountID?: string;
  AccessKeyID?: string;
  AccessKeySecret?: string;
  SecurityToken?: string;
  [key: string]: string;
}
export interface IComponentConfig {
  projectConfig: IProjectConfig;
  method: string;
}

export interface IActionHook {
  run: string;
  pre: boolean;
  path?: string;
  plugin?: string;
}
