import fs from 'fs-extra';
import path from 'path';
import { getRootHome, isBetaS } from '../../libs';
import downloadRequest from '../downloadRequest';
import { execDaemonWithTTL } from '../../execDaemon';
import rimraf from 'rimraf';
import { getCoreVersion } from './utils';

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
  if (isBetaS()) return;
  execDaemonWithTTL('loadcore.js', { lockPath });
}
async function nonExistCore(componentPath: string) {
  fs.ensureDirSync(cachePath);
  const version = await getCoreVersion();
  const url = `https://registry.devsapp.cn/simple/devsapp/core/zipball/${version}`;
  const filename = `core@${version}.zip`;
  await downloadRequest(url, corePath, { filename, extract: true, strip: 1 });
  lns(componentPath);
  fs.writeFileSync(lockPath, JSON.stringify({ version }, null, 2));
}

function lns(componentPath: string) {
  const serverlessDevsPath = path.join(componentPath, 'node_modules', '@serverless-devs');
  const componentCorePath = path.join(serverlessDevsPath, 'core');
  if (isSymbolicLink(componentCorePath)) return;
  rimraf.sync(componentCorePath);
  fs.ensureDirSync(serverlessDevsPath);
  try {
    fs.symlinkSync(corePath, componentCorePath, 'junction');
  } catch (error) {
    fs.copySync(corePath, componentCorePath);
  }
}

function isSymbolicLink(p: string) {
  if (fs.existsSync(p)) {
    return fs.lstatSync(p).isSymbolicLink();
  }
}
