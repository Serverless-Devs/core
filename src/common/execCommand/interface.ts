import Parse from './parse';
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

export interface IGlobalArgs {
  debug?: boolean;
  help?: boolean; // help下也需要skipActions
  skipActions?: boolean;
  access?: string;
  output?: 'default' | 'json' | 'yaml' | 'raw';
}
export interface IComponentConfig {
  projectConfig: IProjectConfig;
  method: string;
  args: string[];
  spath: string;
  serverName: string;
  globalArgs: IGlobalArgs;
  specifyService?: boolean;
  parse: Parse;
  serviceList?: IServiceItem[];
}

export type IActionType = 'run' | 'component' | 'plugin';

export enum IGlobalAction {
  PRE = 'pre',
  SUCCESS = 'success',
  FAIL = 'fail',
  COMPLETE = 'complete',
}

export type IGlobalActionValue = `${IGlobalAction}`;

export interface IRecord {
  status: `${STATUS}`;
  error: Error;
}

export interface IActionHook {
  type: IActionType;
  value: string;
  pre: boolean;
  action: IGlobalActionValue;
  path?: string;
  args?: string;
}

export interface IInputs {
  props: object;
  credentials: ICredentials | undefined;
  appName: string;
  project: {
    component: string;
    access: string;
    projectName: string;
    provider: string;
  };
  command: string;
  args: string;
  argsObj: string[];
  path: {
    configPath: string;
  };
  output: any;
}

export interface IGlobalInputs {
  credentials: ICredentials | undefined;
  appName: string;
  access: string;
  command: string;
  args: string;
  argsObj: string[];
  path: {
    configPath: string;
  };
}

export interface IServiceItem {
  serviceName: string;
  component: string;
  access: string;
  credentials: ICredentials;
  props: object;
  output: any;
}

export enum STATUS {
  SUCCESS = 'success',
  ERROR = 'error',
}
