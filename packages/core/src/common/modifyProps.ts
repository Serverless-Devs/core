import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { merge } from '../libs/utils';
import getYamlContent from './getYamlContent';
import { S_CURRENT_HOME } from '../libs/common';

async function modifyProps(component: string, options: object, sPath: string) {
  if (!component || !sPath) {
    throw new Error('modifyProps方法缺少必填字段');
  }
  const index = sPath.lastIndexOf('/');
  const templte = sPath.slice(index + 1);
  const [name, end] = templte.split('.');
  const originPath = path.resolve(S_CURRENT_HOME, `${name}.origin.${end}`);
  if (!fs.existsSync(originPath)) {
    fs.ensureDirSync(S_CURRENT_HOME);
    fs.copyFileSync(sPath, originPath);
  }
  const userInfo: any = await getYamlContent(sPath);
  userInfo.services[component].props = merge(userInfo.services[component].props, options);
  fs.writeFileSync(sPath, yaml.dump(userInfo));
}

export default modifyProps;
