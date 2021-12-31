import path from 'path';
import getYamlContent from '../getYamlContent';
import { getRootHome, isBetaS } from '../../libs/common';
import { split, filter, includes, find } from 'lodash';
import { DEFAULT_CORE_VERSION } from '../../daemon/constant';

export async function getSetConfig(key) {
  const setConfigPath = path.join(getRootHome(), 'set-config.yml');
  const res = await getYamlContent(setConfigPath);
  if (!res) return;
  return res[key];
}

export async function getComponentVersion(provider: string, componentName: string): Promise<[name: string, version: string]> {
  const [name, version] = split(componentName, '@');
  const { core_load_serverless_devs_component } = process.env;
  if (core_load_serverless_devs_component) {
    const componentList = filter(split(core_load_serverless_devs_component, ';'), (v) =>includes(v, '@'));
    const componentNames = [];
    const obj = {};
    for (const item of componentList) {
      const [n, v] = split(item, '@');
      componentNames.push(n);
      obj[n] = v;
    }
    const key = `${provider}/${name}`
    if (find(componentNames, (v) => v === key)) {
      return [name, obj[key]];
    }
  }
  return [name, version];
}

export async function getCoreVersion() {
  const [, version] = await getComponentVersion('devsapp', 'core');
  if (version) return version;
  return isBetaS() ? 'dev' : DEFAULT_CORE_VERSION;
}