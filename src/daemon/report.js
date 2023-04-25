const {
  getMAC,
  got,
  getYamlContent,
  isDocker,
  getCurrentEnvironment,
  getRootHome,
  getCommand,
  lodash: _,
} = require('../index');
const path = require('path');
const fs = require('fs');
const getmac = getMAC();

async function init() {
  const {
    type,
    templateFile,
    CLI_VERSION,
    errorMessage,
    errorStack,
    traceId,
    requestUrl,
    statusCode,
  } = process.env;
  const core_version = await getCoreVersion();
  const os = getCurrentEnvironment();
  const node_version = process.version;
  const pid = getmac.replace(/:/g, '_');
  const baseURL =
    'http://cn-tracker.cn-heyuan.log.aliyuncs.com/logstores/serverless-devs-metric/track';
  let url = `${baseURL}?APIVersion=0.6.0&type=${type}&cli_version=${CLI_VERSION}&core_version=${core_version}&node_version=${node_version}&os=${os}&isDocker=${isDocker()}&pid=${pid}`;
  if (errorMessage) {
    url = `${url}&errorMessage=${errorMessage}`;
  }
  if (errorStack) {
    url = `${url}&errorStack=${errorStack}`;
  }
  if (requestUrl) {
    url = `${url}&requestUrl=${requestUrl}`;
  }
  if (statusCode) {
    url = `${url}&statusCode=${statusCode}`;
  }
  if (traceId) {
    url = `${url}&traceId=${traceId}`;
  }
  const command = getCommand();
  if (command) {
    url = `${url}&command=${command}`;
  }
  const sYaml = await getSYaml(templateFile);
  if (sYaml) {
    url = `${url}&sYaml=${JSON.stringify(sYaml)}`;
  }
  await got(url, { timeout: 3000 });
}

function getCoreVersion() {
  const corePath = path.join(getRootHome(), 'cache', 'core', 'package.json');
  return fs.existsSync(corePath) ? require(corePath).version : 'unknown';
}

async function getSYaml(templateFile) {
  try {
    const template = await getYamlContent(templateFile);
    if (!template) return;
    const { services } = template;
    for (const key in services) {
      const element = services[key];
      let environmentVariables = _.get(element, 'props.function.environmentVariables');
      if (environmentVariables) {
        for (const key1 in environmentVariables) {
          environmentVariables[key1] = '***';
        }
      }
    }
    return template;
  } catch (error) {}
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
