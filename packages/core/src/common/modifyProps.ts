import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { S_CURRENT } from '../libs/common';
import { merge } from '../libs/utils';
import minimist from 'minimist';

async function modifyProps(service: string, options: object) {
  const args = minimist(process.argv.slice(2));
  const templte = args.t || args.template;
  if (!templte) return;
  const [name] = templte.split('.');
  const originPath = path.resolve(S_CURRENT, `${name}.origin.yml`);
  const filePath = path.resolve(S_CURRENT, templte);
  if (!fs.existsSync(originPath)) {
    fs.copyFileSync(filePath, originPath);
  }
  let userInfo: { [x: string]: any };
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    userInfo = yaml.safeLoad(content);
    userInfo[service].Properties = merge(userInfo[service].Properties, options);
    fs.writeFileSync(filePath, yaml.dump(userInfo));
  } catch (error) {
    // ignore
  }
}

export default modifyProps;
