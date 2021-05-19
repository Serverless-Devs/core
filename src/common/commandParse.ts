import { IInputs, IV1Inputs } from '../interface';
import minimist from 'minimist';

function commandParse(
  inputs: IInputs | IV1Inputs,
  opts?: object,
): { rawData?: string; data: object } {
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

export default commandParse;
