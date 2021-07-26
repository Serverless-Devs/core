import { readJsonFile, writeJsonFile } from '../libs/utils';
import path from 'path';
import fs from 'fs-extra';

export async function getState(id: any, dirPath?: string) {
  const spath = path.resolve(process.env.templateFile, '../.s');

  const temp = dirPath ? path.resolve(spath, dirPath) : spath;

  const stateFilePath = path.join(temp, `${id}.json`);
  return readJsonFile(stateFilePath);
}

export async function setState(id: any, state: any, dirPath?: string) {
  const spath = path.resolve(process.env.templateFile, '../.s');
  fs.ensureDirSync(spath);
  const temp = dirPath ? path.resolve(spath, dirPath) : spath;
  const stateFilePath = path.join(temp, `${id}.json`);
  fs.ensureFileSync(stateFilePath);
  writeJsonFile(stateFilePath, state);
  return state;
}
