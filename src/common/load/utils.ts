import { isBetaS } from '../../libs';
import { split, filter, includes, find } from 'lodash';
import { DEFAULT_CORE_VERSION } from '../../daemon/constant';

export async function getComponentVersion(
  provider: string,
  componentName: string,
): Promise<[name: string, version: string]> {
  const [name, version] = split(componentName, '@');
  const { core_load_serverless_devs_component } = process.env;
  if (core_load_serverless_devs_component) {
    const componentList = filter(split(core_load_serverless_devs_component, ';'), (v) =>
      includes(v, '@'),
    );
    const componentNames = [];
    const obj = {};
    for (const item of componentList) {
      const [n, v] = split(item, '@');
      componentNames.push(n);
      obj[n] = v;
    }
    const key = `${provider}/${name}`;
    if (find(componentNames, (v) => v === key)) {
      return [name, obj[key]];
    }
  }
  return [name, version];
}

export async function getCoreVersion() {
  return isBetaS() ? 'dev' : DEFAULT_CORE_VERSION;
}
