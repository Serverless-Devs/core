const { execSync } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { downloadRequest } = require('../index');
const { DEFAULT_CORE_VERSION } = require('./constant');

const S_ROOT_HOME = path.join(os.homedir(), '.s');
const cachePath = path.join(S_ROOT_HOME, 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(cachePath, '.s-core.lock');

function readJsonFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

async function init() {
  let version;
  try {
    version = execSync('npm view @serverless-devs/core version');
    version = version.toString().replace(/\n/g, '');
  } catch (error) {
    version = DEFAULT_CORE_VERSION;
  }
  const lockFileInfo = readJsonFile(lockPath);
  if (version === lockFileInfo.version) {
    return fs.writeFileSync(lockPath, JSON.stringify({ version, pending: 0 }, null, 2));
  }
  fs.ensureDirSync(cachePath);
  const url = `https://registry.npmjs.org/@serverless-devs/core/-/core-${version}.tgz`;
  const filename = `core_${Date.now()}.zip`;
  await downloadRequest(url, corePath, { filename, extract: true, strip: 1 });
  fs.writeFileSync(lockPath, JSON.stringify({ version, pending: 0 }, null, 2));
}

init();
