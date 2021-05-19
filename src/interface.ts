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

export interface IV1Inputs {
  Properties?: any;
  Credentials?: any;
  Project?: {
    ProjectName?: string;
    Component?: string;
    Provider?: string;
    AccessAlias?: string;
  };
  Command?: string;
  Args?: string;
  State?: object;
  Path?: {
    ConfigPath?: string;
  };
}
