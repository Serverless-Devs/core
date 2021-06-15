import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { execSync } from 'child_process';
import { S_ROOT_HOME } from '../../libs/common';
import { downloadRequest } from '../request';
import { readJsonFile } from '../../libs/utils';
import installDependency from '../installDependency';
import rimraf from 'rimraf';

const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');

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

function getCoreInfo() {
  let version: any = execSync('npm view @serverless-devs/core version');
  version = version.toString().replace(/\n/g, '');

  return {
    url: `https://registry.npmjs.org/@serverless-devs/core/-/core-${version}.tgz`,
    version,
  };
}

export async function downLoadDesCore(componentPath) {
  const { url, version } = getCoreInfo();
  const lockPath = path.resolve(corePath, '.s.lock');
  let needLoad: boolean;
  if (fs.existsSync(lockPath)) {
    needLoad = version !== readJsonFile(lockPath).version;
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
  fs.ensureSymlinkSync(corePath, `${componentPath}/node_modules/@serverless-devs/core`, 'dir');
}
