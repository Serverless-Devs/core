const fs = require('fs');
const path = require('path');
const { downloadRequest, request, semver, getRootHome } = require('../index');
const { DEFAULT_CORE_VERSION } = require('./constant');

const cachePath = path.join(getRootHome(), 'cache');
const corePath = path.join(cachePath, 'core');
const lockPath = path.resolve(corePath, '.s.lock');

function readJsonFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

async function init() {
  let version;
  try {
    const result = await request('https://registry.devsapp.cn/simple/devsapp/core/releases/latest');
    version = result.tag_name;
  } catch (error) {
    version = DEFAULT_CORE_VERSION;
  }
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (semver.lte(version, lockFileInfo.version)) {
    return fs.writeFileSync(
      lockPath,
      JSON.stringify({ version: lockFileInfo.version, currentTimestamp: now }, null, 2),
    );
  }
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath);
  }
  const url = `https://registry.devsapp.cn/simple/devsapp/core/zipball/${version}`;
  const filename = `core@${version}.zip`;
  await downloadRequest(url, corePath, { filename, extract: true, strip: 1 });
  fs.writeFileSync(lockPath, JSON.stringify({ version, currentTimestamp: now }, null, 2));
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
