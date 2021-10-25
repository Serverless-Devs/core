const { getMAC, request, getYamlContent, isDocker } = require('../index');
const path = require('path');
const fs = require('fs');
const os = require('os');
const getmac = getMAC();
const TypeError = ['jsError', 'networkError'];

async function init() {
  const { type, templateFile, traceId, CLI_VERSION } = process.env;
  let { content } = process.env;
  const core_version = getCoreVersion();
  const os = getCicdEnv() || process.platform;
  const node_version = process.version;
  const time = 1;
  const pid = getmac.replace(/:/g, '_');
  const baseURL =
    'http://dankun.ccc45d9d8e32b44eeac168caa1a2deead.cn-zhangjiakou.alicontainer.com/r.png';
  let url = `${baseURL}?type=${type}&cli_version=${CLI_VERSION}&core_version=${core_version}&os=${os}&node_version=${node_version}&pid=${pid}&time=${time}&isDocker=${isDocker()}`;
  if (traceId) {
    url = `${url}&traceId=${traceId}`;
  }
  if (getCommand()) {
    url = `${url}&command=${getCommand()}`;
  }
  if (TypeError.includes(type) && fs.existsSync(templateFile)) {
    const template = await getYamlContent(templateFile);
    content = `${content}||${JSON.stringify(template)}`;
  }
  await request(url, { method: 'post', json: false, body: content, timeout: 3000 });
}

function getCicdEnv() {
  for (const key in process.env) {
    if (key.startsWith('CLOUDSHELL')) return 'aliyun_ecs';
    if (key.startsWith('PIPELINE')) return 'yunxiao';
    if (key.startsWith('GITHUB')) return 'github';
    if (key.startsWith('GITLAB')) return 'gitlab';
    if (key.startsWith('JENKINS')) return 'jenkins';
  }
}

function getCoreVersion() {
  const corePath = path.join(os.homedir(), '.s', 'cache', 'core', 'package.json');
  return fs.existsSync(corePath) ? require(corePath).version : 'unknown';
}

function getCommand() {
  try {
    const serverless_devs_temp_argv = JSON.parse(process.env['serverless_devs_temp_argv']);
    const command = serverless_devs_temp_argv.slice(2);
    return command ? `s ${command.join(' ')}` : undefined;
  } catch (error) {}
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
