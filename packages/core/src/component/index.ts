import credentials from './credentials';
import { IInputs, IV1Inputs } from '../interface';
import minimist from 'minimist';

export interface IComponent {
  load: (name: string, provider: string) => Promise<any>;
  credentials: (inputs: IInputs | IV1Inputs) => Promise<any>;
  args: (inputs: IInputs | IV1Inputs, opts?: object) => { rawData?: string; data: object };
}

export class Component {
  async credentials(inputs: IInputs | IV1Inputs) {
    return await credentials(inputs);
  }

  args(inputs: IInputs | IV1Inputs, opts?: object): { rawData?: string; data: object } {
    // @ts-ignore
    const argsStr = inputs?.args || inputs?.Args;
    if (!argsStr) {
      return { rawData: argsStr, data: undefined };
    }
    return {
      rawData: argsStr,
      data: minimist(argsStr.split(/[\s]+/g), opts || {}),
    };
  }
}
