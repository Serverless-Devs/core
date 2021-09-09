import { readJsonFile, writeJsonFile } from '../libs/utils';
import path from 'path';
import fs from 'fs-extra';

export async function getState(id: any, dirPath?: string) {
  const templateFile = process.env.templateFile;
  const spath = fs.existsSync(templateFile)
    ? path.resolve(templateFile, '../.s')
    : path.join(process.cwd(), '.s');
  const temp = dirPath ? path.resolve(spath, dirPath) : spath;
  const stateFilePath = path.join(temp, `${id}.json`);
  return readJsonFile(stateFilePath);
}

export async function setState(id: any, state: any, dirPath?: string) {
  const templateFile = process.env.templateFile;
  const spath = fs.existsSync(templateFile)
    ? path.resolve(templateFile, '../.s')
    : path.join(process.cwd(), '.s');
  fs.ensureDirSync(spath);
  const temp = dirPath ? path.resolve(spath, dirPath) : spath;
  const stateFilePath = path.join(temp, `${id}.json`);
  fs.ensureFileSync(stateFilePath);
  writeJsonFile(stateFilePath, state);
  return state;
}
