const fs = require('fs');
const path = require('path');
const { downloadRequest, request, installDependency, semver } = require('../index');

function readJsonFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

async function tryfun(f) {
  try {
    return await f;
  } catch (error) {
    // ignore error
  }
}

const getReleasesLatest = async ({ provider, name, registry }) => {
  const url =
    provider === '.'
      ? `${registry}/${name}/releases/latest`
      : `${registry}/${provider}/${name}/releases/latest`;
  return await request(url);
};

async function init() {
  const { provider, name, componentPath, lockPath, registry } = process.env;
  const result = await tryfun(getReleasesLatest({ provider, name, registry }));
  if (!result) return;
  const { zipball_url, tag_name } = result;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (semver.lte(tag_name, lockFileInfo.version)) {
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

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
