export interface IInputs {
  properties?: any;
  credentials?: any;
  project?: {
    projectName?: string;
    component?: string;
    provider?: string;
    accessAlias?: string;
  };
  command?: string;
  args?: string;
  state?: object;
  path?: {
    configPath?: string;
  };
}

export interface IGlobalParams {
  access?: string;
  skipActions?: boolean;
  debug?: boolean;
}
