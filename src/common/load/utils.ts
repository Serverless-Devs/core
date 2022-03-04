import { isBetaS } from '../../libs';
import { split, filter, includes, find, trim } from 'lodash';
import { DEFAULT_CORE_VERSION } from '../../daemon/constant';
import path from 'path';
import fs from 'fs-extra';

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

export function replaceFun(str, obj) {
  const reg = /\{\{(.*?)\}\}/g;
  let arr = str.match(reg);
  if (arr) {
    for (let i = 0; i < arr.length; i++) {
      let keyContent = arr[i].replace(/{{|}}/g, '');
      let realKey = trim(keyContent.split('|')[0]);
      if (obj[realKey]) {
        str = str.replace(arr[i], obj[realKey]);
      }
    }
  }
  return str;
}

export function getTemplatekey(str) {
  const reg = /\{\{(.*?)\}\}/g;
  const arr = str.match(reg);
  if (!arr) {
    return [];
  }
  return arr
    .filter((result) => result)
    .map((matchValue) => {
      let keyContent = matchValue.replace(/{{|}}/g, '');
      let realKey = keyContent.split('|');
      return {
        name: trim(realKey[0]),
        desc: trim(realKey[1]),
      };
    });
}

export const getYamlPath = (prePath: string, name: string) => {
  const S_PATH1 = path.join(prePath, `${name}.yaml`);
  if (fs.existsSync(S_PATH1)) return S_PATH1;
  const S_PATH2 = path.join(prePath, `${name}.yml`);
  if (fs.existsSync(S_PATH2)) return S_PATH2;
};
