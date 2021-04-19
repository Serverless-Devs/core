import { S_CURRENT_HOME } from '../libs/common';
import { readJsonFile, writeJsonFile } from '../libs/utils';
import path from 'path';
import fs from 'fs-extra';

export async function getState(id: any) {
  const stateFilePath = path.join(S_CURRENT_HOME, `${id}.json`);
  if (fs.existsSync(stateFilePath)) {
    return readJsonFile(stateFilePath);
  }
}

export async function setState(id: any, state: any) {
  const stateFilePath = path.join(S_CURRENT_HOME, `${id}.json`);
  if (!fs.existsSync(stateFilePath)) {
    fs.openSync(stateFilePath, 'w');
  }
  writeJsonFile(stateFilePath, state);
  return state;
}
