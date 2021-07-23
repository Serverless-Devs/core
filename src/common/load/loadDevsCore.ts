import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { exec, execSync } from 'child_process';
import { S_ROOT_HOME } from '../../libs/common';
import { downloadRequest } from '../request';
import { readJsonFile } from '../../libs/utils';
import { getCoreVersionFromGit } from './service';
import installDependency from '../installDependency';
import rimraf from 'rimraf';

const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(cachePath, '.s-core.lock');

export function removeDevsCore(componentPath) {
  const node_module_core = path.join(componentPath, '/node_modules/@serverless-devs/core');
  if (fs.existsSync(node_module_core)) {
    rimraf.sync(node_module_core);
  }
  const packagePath = path.join(componentPath, 'package.json');
  const packageInfo = readJsonFile(packagePath);
  if (get(packageInfo, ['dependencies', '@serverless-devs/core'])) {
    delete packageInfo.dependencies['@serverless-devs/core'];
  }
  fs.writeFileSync(packagePath, JSON.stringify(packageInfo, null, 2));
}

async function getCoreVersion() {
  if (!fs.existsSync(lockPath)) {
    try {
      let version: any = execSync('npm view @serverless-devs/core version');
      return version.toString().replace(/\n/g, '');
    } catch (error) {
      const version = await getCoreVersionFromGit();
      return version || '0.0.131';
    }
  }
  exec('npm view @serverless-devs/core version', (error, output) => {
    const curVersion = output.toString().replace(/\n/g, '');
    fs.writeFileSync(lockPath, JSON.stringify({ version: curVersion }, null, 2));
  });
  const version = readJsonFile(lockPath);
  return get(version, 'version');
}

export async function downLoadDesCore(componentPath) {
  const version = await getCoreVersion();
  const url = `https://registry.npmjs.org/@serverless-devs/core/-/core-${version}.tgz`;
  let needLoad: boolean;
  if (fs.existsSync(lockPath)) {
    const versionJson = readJsonFile(path.resolve(corePath, 'package.json'));
    needLoad = versionJson ? version !== versionJson.version : true;
    needLoad && rimraf.sync(corePath);
  } else {
    needLoad = true;
  }
  if (needLoad) {
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath);
    }
    await downloadRequest(url, corePath, { extract: true, strip: 1 });
    await installDependency({ cwd: corePath });
    fs.writeFileSync(lockPath, JSON.stringify({ version }, null, 2));
  }

  const componentCorePath = path.join(componentPath, 'node_modules', '@serverless-devs', 'core');
  try {
    fs.ensureSymlinkSync(corePath, componentCorePath, 'dir');
  } catch (error) {
    fs.copySync(path.join(corePath, 'dist'), path.join(componentCorePath, 'dist'));
    fs.copyFileSync(
      path.join(corePath, 'package.json'),
      path.join(componentCorePath, 'package.json'),
    );
  }
}
