const {
  got,
  isDocker,
  getCicdEnv,
  getRootHome,
  getCommand,
  lodash: _,
  getAccountByAccess,
  getYamlContent,
} = require('../index');
const path = require('path');
const fs = require('fs');

async function init() {
  const { CLI_VERSION, syaml } = process.env;
  const core_version = await getCoreVersion();
  const os = getCicdEnv() || process.platform;
  const node_version = process.version;
  const baseURL = 'http://cn-tracker.cn-heyuan.log.aliyuncs.com/logstores/serverless-devs/track';
  let url = `${baseURL}?APIVersion=0.6.0&cli_version=${CLI_VERSION}&core_version=${core_version}&node_version=${node_version}&os=${os}&isDocker=${isDocker()}&trackerType=command`;
  if (getCommand()) {
    url = `${url}&trackerName=${getCommand()}`;
  }
  const mainUid = await getMainUid(syaml);
  if (mainUid) {
    url = `${url}&mainUid=${mainUid}`;
  }
  await got(url, { timeout: 3000 });
}

function getCoreVersion() {
  const corePath = path.join(getRootHome(), 'cache', 'core', 'package.json');
  return fs.existsSync(corePath) ? require(corePath).version : 'unknown';
}

async function getMainUid(syaml) {
  try {
    const data = await getYamlContent(syaml);
    if (_.get(data, 'access')) {
      const credentials = await getAccountByAccess(data.access);
      return credentials.AccountID;
    }
  } catch (error) {}
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
