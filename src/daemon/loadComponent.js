const fs = require('fs');
const path = require('path');
const { downloadRequest, request, installDependency } = require('../index');

function readJsonFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

const RegistryEnum = {
  github: 'https://api.github.com/repos',
  serverless: 'https://registry.devsapp.cn/simple',
};

async function tryfun(f) {
  try {
    return await f;
  } catch (error) {
    // ignore error
  }
}

const getServerlessReleasesLatest = async (provider, name) => {
  const url =
    provider === '.'
      ? `${RegistryEnum.serverless}/${name}/releases/latest`
      : `${RegistryEnum.serverless}/${provider}/${name}/releases/latest`;
  return await request(url);
};

async function init() {
  console.log(process.env, 'env');
  const { provider, name, componentPath, lockPath } = process.env;
  const result = await tryfun(getServerlessReleasesLatest(provider, name));
  if (!result) return;
  const { zipball_url, tag_name } = result;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (tag_name <= lockFileInfo.version) {
    return fs.writeFileSync(
      lockPath,
      JSON.stringify({ version: lockFileInfo.version, currentTimestamp: now }, null, 2),
    );
  }
  const filename = path.join(provider, `${name}@${tag_name}`);
  await downloadRequest(zipball_url, componentPath, {
    filename,
    extract: true,
    strip: 1,
  });
  await installDependency({ cwd: componentPath, production: true });
  fs.writeFileSync(lockPath, JSON.stringify({ version: tag_name, currentTimestamp: now }, null, 2));
}

init();
