import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { spawn } from 'child_process';
import { S_ROOT_HOME } from './libs/common';
import { downloadRequest } from './common/request';
import { readJsonFile } from './libs/utils';
import { DEFAULT_CORE_VERSION } from './cp/constant';
import rimraf from 'rimraf';

const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(cachePath, '.s-core.lock');

export function removeDevsCore(componentPath) {
  const packagePath = path.join(componentPath, 'package.json');
  const packageInfo = readJsonFile(packagePath);
  if (get(packageInfo, ['dependencies', '@serverless-devs/core'])) {
    delete packageInfo.dependencies['@serverless-devs/core'];
  }
  fs.writeFileSync(packagePath, JSON.stringify(packageInfo, null, 2));
}

async function existCore() {
  const lockFileInfo = readJsonFile(lockPath);
  if (lockFileInfo.pending === 1) return;
  fs.writeFileSync(lockPath, JSON.stringify({ ...lockFileInfo, pending: 1 }, null, 2));

  const subprocess = spawn(process.execPath, [path.resolve(__dirname, './cp/loadcore.js')], {
    detached: true,
    stdio: 'ignore',
  });
  subprocess.unref();
}
async function nonExistCore(componentPath: string) {
  fs.ensureDirSync(cachePath);
  const url = `https://registry.npmjs.org/@serverless-devs/core/-/core-${DEFAULT_CORE_VERSION}.tgz`;
  await downloadRequest(url, corePath, { extract: true, strip: 1 });
  const componentCorePath = path.join(componentPath, 'node_modules', '@serverless-devs', 'core');
  rimraf.sync(componentCorePath);
  try {
    fs.ensureSymlinkSync(corePath, componentCorePath, 'dir');
  } catch (error) {
    fs.copySync(path.join(corePath, 'dist'), path.join(componentCorePath, 'dist'));
    fs.copyFileSync(
      path.join(corePath, 'package.json'),
      path.join(componentCorePath, 'package.json'),
    );
  }
  fs.writeFileSync(lockPath, JSON.stringify({ version: DEFAULT_CORE_VERSION }, null, 2));
}
export async function downLoadDesCore(componentPath: string) {
  if (fs.existsSync(lockPath)) {
    return await existCore();
  }
  await nonExistCore(componentPath);
}
