import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { S_ROOT_HOME } from './libs/common';
import { downloadRequest } from './common/request';
import { readJsonFile } from './libs/utils';
import { DEFAULT_CORE_VERSION } from './daemon/constant';
import rimraf from 'rimraf';

const TTL = 5 * 60 * 1000;
const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(cachePath, '.s-core.lock');

export async function downLoadDesCore(componentPath: string) {
  if (fs.existsSync(lockPath)) {
    return await existCore(componentPath);
  }
  await nonExistCore(componentPath);
}

async function existCore(componentPath: string) {
  lns(componentPath);
  const loadcorePath = path.resolve(__dirname, './daemon/loadcore.js');
  if (!fs.existsSync(loadcorePath)) return;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (now - lockFileInfo.currentTimestamp < TTL) return;
  fs.writeFileSync(lockPath, JSON.stringify({ ...lockFileInfo, currentTimestamp: now }, null, 2));
  const subprocess = spawn(process.execPath, [path.resolve(__dirname, './daemon/loadcore.js')], {
    detached: true,
    stdio: 'ignore',
  });
  subprocess.unref();
}
async function nonExistCore(componentPath: string) {
  fs.ensureDirSync(cachePath);
  const url = `https://registry.devsapp.cn/simple/devsapp/core/zipball/${DEFAULT_CORE_VERSION}`;
  await downloadRequest(url, corePath, { extract: true, strip: 1 });
  lns(componentPath);
  fs.writeFileSync(lockPath, JSON.stringify({ version: DEFAULT_CORE_VERSION }, null, 2));
}

function lns(componentPath: string) {
  const componentCorePath = path.join(componentPath, 'node_modules', '@serverless-devs', 'core');
  if (isSymbolicLink(componentCorePath)) return;
  if (copyAgain(componentCorePath)) {
    return fs.copySync(corePath, componentCorePath);
  }
  try {
    rimraf.sync(componentCorePath);
    fs.ensureSymlinkSync(corePath, componentCorePath, 'dir');
  } catch (error) {
    fs.copySync(corePath, componentCorePath);
  }
}

function isSymbolicLink(p: string) {
  if (fs.existsSync(p)) {
    return fs.lstatSync(p).isSymbolicLink();
  }
}

function copyAgain(p: string) {
  const packagePath = path.join(corePath, 'package.json');
  const packageInfo = readJsonFile(packagePath);
  const componentPackagePath = path.join(p, 'package.json');
  const componentPackageInfo = readJsonFile(componentPackagePath);
  return (
    componentPackageInfo && packageInfo && componentPackageInfo.version !== packageInfo.version
  );
}
