import { S_CURRENT_HOME } from '../libs/common';
import { readJsonFile, writeJsonFile } from '../libs/utils';
import path from 'path';
import fs from 'fs-extra';

export async function getState(id: any, dirPath?: string) {
  const temp = dirPath ? path.resolve(S_CURRENT_HOME, dirPath) : S_CURRENT_HOME;

  const stateFilePath = path.join(temp, `${id}.json`);
  return readJsonFile(stateFilePath);
}

export async function setState(id: any, state: any, dirPath?: string) {
  fs.ensureDirSync(S_CURRENT_HOME);
  const temp = dirPath ? path.resolve(S_CURRENT_HOME, dirPath) : S_CURRENT_HOME;
  const stateFilePath = path.join(temp, `${id}.json`);
  fs.ensureFileSync(stateFilePath);
  writeJsonFile(stateFilePath, state);
  return state;
}
