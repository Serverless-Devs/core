export interface IProjectConfig {
  component: string;
  props: object;
  access: string;
  provider: string;
  appName: string;
  serviceName: string;
}

export interface IComponentConfig {
  projectConfig: IProjectConfig;
}
