import { ParsedArgs } from 'minimist';
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

export interface IGlobalParams extends ParsedArgs {
  access?: string;
  template?: string;
  help?: boolean;
  version?: boolean;
  debug?: boolean;
  'skip-actions'?: boolean;
}
