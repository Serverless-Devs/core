const { getMAC, request } = require('../index');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const pid = getMAC();

async function init() {
  const { type } = process.env;
  const cli_version = getCliVersion();
  const core_version = getCoreVersion();
  const os = process.platform;
  const node_version = process.version;
  const baseURL =
    'http://dankun.ccc45d9d8e32b44eeac168caa1a2deead.cn-zhangjiakou.alicontainer.com/r.png';
  const url = `${baseURL}?type=${type}&cli_version=${cli_version}&core_version=${core_version}&os=${os}&node_version=${node_version}&pid=${pid}`;
  await request(url, { method: 'post', json: false });
}

function getCoreVersion() {
  const corePath = path.join(os.homedir(), '.s', 'cache', 'core', 'package.json');
  return fs.existsSync(corePath) ? require(corePath).version : 'unknown';
}

function getCliVersion() {
  let version = getCliVersionWithNpm();
  if (version) return version;
  version = getCliVersionWithYarn();
  if (version) return version;
  return 'unknown';
}

function getCliVersionWithNpm() {
  try {
    const prefix = execSync('npm root -g');
    const formatPrefix = prefix.toString().replace(/\n/, '');
    const spath = path.join(formatPrefix, '@serverless-devs', 's', 'package.json');
    if (fs.existsSync(spath)) {
      return require(spath).version;
    }
  } catch (error) {}
}

function getCliVersionWithYarn() {
  try {
    const prefix = execSync('yarn global dir');
    const formatPrefix = prefix.toString().replace(/\n/, '');
    const spath = path.join(formatPrefix, 'node_modules', '@serverless-devs', 's', 'package.json');
    if (fs.existsSync(spath)) {
      return require(spath).version;
    }
  } catch (error) {}
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
