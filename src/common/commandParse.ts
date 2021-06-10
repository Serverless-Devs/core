import { IInputs, IV1Inputs } from '../interface';
import minimist from 'minimist';
import path from 'path'
import child_process from 'child_process'

function commandParse(
  inputs: IInputs | IV1Inputs,
  opts?: object,
): { rawData?: string; data: object } {
  // @ts-ignore
  const argsStr = inputs?.args || inputs?.Args;
  if (!argsStr) {
    return { rawData: argsStr, data: undefined };
  }
  let newArgv
  try {
    const tempResult = child_process.execSync(`${process.argv[0]} ${path.join(__dirname, '../../src/common/utils', 'args.js')} ${argsStr}`)
    const tempOutput = tempResult.toString()
    const tempArgv = tempOutput.substring(0, tempOutput.length - 1)
    newArgv = tempArgv.split(/--serverless-devs--core--parse--/g)
  }catch (e){
    newArgv = argsStr.split(/[\s]+/g)
  }
  return {
    rawData: argsStr,
    data: minimist(newArgv, opts || {}),
  };
}

export default commandParse;
