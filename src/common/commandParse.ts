import { IInputs, IV1Inputs } from '../interface';
import minimist from 'minimist';
import path from 'path'
import child_process from 'child_process'

function commandParse(
  inputs: IInputs | IV1Inputs,
  opts?: object,
): { rawData?: string; data: object } {
  // @ts-ignore
  let argsData = inputs?.argsObj || inputs?.ArgsObj || inputs?.args || inputs?.Args;
  if (!argsData) {
    return { rawData: argsData, data: undefined };
  }
  let newArgv
  if (typeof argsData == 'object'){
    newArgv = minimist(argsData, opts || {})
  }else{
//     try {
//       const tempResult = child_process.execSync(`${process.argv[0]} ${path.join(__dirname, 'args.js')} ${argsData}`)
//       const tempOutput = tempResult.toString()
//       const tempArgv = tempOutput.substring(0, tempOutput.length - 1)
//       newArgv = minimist(tempArgv.split(/--serverless-devs--core--parse--/g), opts || {})
//     }catch (e){
      newArgv = minimist(argsData.split(/[\s]+/g), opts || {})
//     }
  }
  return {
    rawData: argsData,
    data: newArgv
  };
}

export default commandParse;
