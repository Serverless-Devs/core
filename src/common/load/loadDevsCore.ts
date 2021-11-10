import fs from 'fs-extra';
import path from 'path';
import { getRootHome } from '../../libs/common';
import { downloadRequest } from '../request';
import { DEFAULT_CORE_VERSION } from '../../daemon/constant';
import { execDaemonWithTTL } from '../../execDaemon';
import rimraf from 'rimraf';

const cachePath = path.join(getRootHome(), 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(corePath, '.s.lock');

export async function downLoadDesCore(componentPath: string) {
  if (fs.existsSync(lockPath)) {
    return await existCore(componentPath);
  }
  await nonExistCore(componentPath);
}

async function existCore(componentPath: string) {
  lns(componentPath);
  execDaemonWithTTL('loadcore.js', { lockPath });
}
async function nonExistCore(componentPath: string) {
  fs.ensureDirSync(cachePath);
  const url = `https://registry.devsapp.cn/simple/devsapp/core/zipball/${DEFAULT_CORE_VERSION}`;
  const filename = `core@${DEFAULT_CORE_VERSION}.zip`;
  await downloadRequest(url, corePath, { filename, extract: true, strip: 1 });
  lns(componentPath);
  fs.writeFileSync(lockPath, JSON.stringify({ version: DEFAULT_CORE_VERSION }, null, 2));
}

function lns(componentPath: string) {
  const serverlessDevsPath = path.join(componentPath, 'node_modules', '@serverless-devs');
  const componentCorePath = path.join(serverlessDevsPath, 'core');
  if (isSymbolicLink(componentCorePath)) return;
  rimraf.sync(componentCorePath);
  fs.ensureDirSync(serverlessDevsPath);
  fs.symlinkSync(corePath, componentCorePath, 'junction');
}

function isSymbolicLink(p: string) {
  if (fs.existsSync(p)) {
    return fs.lstatSync(p).isSymbolicLink();
  }
}
