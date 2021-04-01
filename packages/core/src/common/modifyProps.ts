import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { S_CURRENT } from '../libs/common';
import { merge } from '../libs/utils';
import minimist from 'minimist';
import getYamlContent from './getYamlContent';

async function modifyProps(service: string, options: object) {
  const args = minimist(process.argv.slice(2));
  let templte = args.t || args.template;
  if (!templte) {
    if (fs.existsSync(path.resolve(S_CURRENT, 's.yaml'))) {
      templte = 's.yaml';
    }
    if (fs.existsSync(path.resolve(S_CURRENT, 's.yml'))) {
      templte = 's.yml';
    }
  }
  const [name, end] = templte.split('.');
  const originPath = path.resolve(S_CURRENT, `${name}.origin.${end}`);
  const filePath = path.resolve(S_CURRENT, templte);
  if (!fs.existsSync(originPath)) {
    fs.copyFileSync(filePath, originPath);
  }
  let userInfo: { [x: string]: any };
  try {
    userInfo = await getYamlContent(filePath);
    userInfo[service].Properties = merge(userInfo[service].Properties, options);
    fs.writeFileSync(filePath, yaml.dump(userInfo));
  } catch (error) {
    // ignore
  }
}

export default modifyProps;
