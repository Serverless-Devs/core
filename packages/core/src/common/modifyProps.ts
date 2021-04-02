import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { S_CURRENT } from '../libs/common';
import { merge } from '../libs/utils';
import minimist from 'minimist';
// import getYamlContent from './getYamlContent';
// TODO：后续 getYamlContent 方法从外部引入

/**
 *
 * @param filePath 文件的当前路径
 * @description 函数内部会兼容yaml和yml文件，返回文件内容
 */
async function getYamlContent(filePath: string) {
  // yaml 文件
  if (filePath.endsWith('yaml')) {
    if (fs.existsSync(filePath)) {
      return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
    }
    const ymlPath = filePath.replace('.yaml', '.yml');
    if (fs.existsSync(ymlPath)) {
      return yaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'));
    }
  }

  // yml 文件
  if (filePath.endsWith('yml')) {
    if (fs.existsSync(filePath)) {
      return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
    }
    const yamlPath = filePath.replace('.yml', '.yaml');
    if (fs.existsSync(yamlPath)) {
      return yaml.safeLoad(fs.readFileSync(yamlPath, 'utf8'));
    }
  }
}

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
  if (!templte) return;
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
