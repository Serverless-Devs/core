const { execSync } = require('child_process');
const { getCoreVersionFromGit } = require('./service');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { downloadRequest } = require('../request');
const { readJsonFile } = require('../../libs/utils');
const rimraf = require('rimraf');

const S_ROOT_HOME = path.join(os.homedir(), '.s');
const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const coreBackUpPath = path.join(cachePath, `core_${Date.now()}_backup`);
const lockPath = path.resolve(cachePath, '.s-core.lock');

async function init() {
  let version;
  try {
    version = execSync('npm view @serverless-devs/core version');
    version = version.toString().replace(/\n/g, '');
  } catch (error) {
    const v = await getCoreVersionFromGit();
    version = v || '0.0.131';
  }
  const lockFileInfo = readJsonFile(lockPath);
  if (version === lockFileInfo.version) {
    return fs.writeFileSync(lockPath, JSON.stringify({ version, pending: 0 }, null, 2));
  }
  fs.ensureDirSync(cachePath);
  const url = `https://registry.npmjs.org/@serverless-devs/core/-/core-${version}.tgz`;
  await downloadRequest(url, coreBackUpPath, { extract: true, strip: 1 });
  fs.copySync(coreBackUpPath, corePath);
  rimraf.sync(coreBackUpPath);
  fs.writeFileSync(lockPath, JSON.stringify({ version, pending: 0 }, null, 2));
}

init();
