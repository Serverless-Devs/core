import path from 'path';
import fs from 'fs-extra';
import { getYamlContent, isYamlFile } from '../../libs';
import { first, get, isEmpty, isPlainObject, omit } from 'lodash';
import yaml from 'js-yaml';
import chalk from 'chalk';
import extend2 from 'extend2';
import parseYaml from '../parseYaml';

async function checkYaml(spath: string) {
  const filename = path.basename(spath);
  const data = await getYamlContent(spath);
  // 校验 edition 字段
  if (!['1.0.0', '2.0.0'].includes(get(data, 'edition'))) {
    throw new Error(
      JSON.stringify({
        message: `The edition field in the ${filename} file is incorrect.`,
        tips: `Please check the edition field of ${filename}, you can specify it as 1.0.0 or 2.0.0.`,
      }),
    );
  }
  const services = get(data, 'services');
  // 校验 services 字段
  if (!isPlainObject(services)) {
    throw new Error(
      JSON.stringify({
        message: `The services field in the ${filename} file is incorrect.`,
        tips: `Please check the services field of ${filename}, documents: ${chalk.underline(
          'https://docs.serverless-devs.com/fc/yaml/readme',
        )}.`,
      }),
    );
  }

  // 校验 component 字段
  for (const key in services) {
    const ele = services[key];
    if (isEmpty(ele.component)) {
      throw new Error(
        JSON.stringify({
          message: `The component field in ${key} service is incorrect.`,
          tips: `Please check the component field in ${key} service, documents: ${chalk.underline(
            'https://docs.serverless-devs.com/fc/yaml/readme',
          )}.`,
        }),
      );
    }
  }
  return spath;
}

async function setupEnv(templateFile: string) {
  const spath = path.dirname(templateFile);
  const envPath = path.join(spath, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
  const data = await getYamlContent(templateFile);
  const services = get(data, 'services');
  if (isEmpty(services)) return;
  for (const key in services) {
    const element = services[key];
    let codeUri = get(element, 'props.function.codeUri');
    if (codeUri) {
      codeUri = path.isAbsolute(codeUri) ? codeUri : path.join(spath, codeUri);
      const codeUriEnvPath = path.join(codeUri, '.env');
      fs.existsSync(codeUriEnvPath) && require('dotenv').config({ path: codeUriEnvPath });
    }
  }
}

async function extendsYaml(spath: string, dotspath: string) {
  const data = await getYamlContent(spath);
  const extendsPath = data?.extends ? first(data.extends) : undefined;
  let baseYamlPath = data?.extend ? data.extend : extendsPath;
  if (isEmpty(baseYamlPath)) return;

  if (!path.isAbsolute(baseYamlPath)) {
    let fixedPath = path.resolve(path.dirname(spath), baseYamlPath);
    if (fs.existsSync(fixedPath)) baseYamlPath = fixedPath;
  }

  await isYamlFile(baseYamlPath);
  // 解析base yaml之前，先合并vars
  if (data?.vars) {
    const baseYamlData = await getYamlContent(baseYamlPath);
    const newData = extend2(true, {}, baseYamlData, { vars: data.vars });
    // 临时写到dotspath
    fs.writeFileSync(dotspath, yaml.dump(newData));
  }
  // 解析base yaml
  const baseYamlData = await parseYaml(fs.readFileSync(dotspath, 'utf-8'));
  // 只合并vars
  const newData = extend2(true, {}, { vars: baseYamlData?.vars }, data);
  fs.writeFileSync(dotspath, yaml.dump(newData));
  // 解析yaml
  const parsedData = await parseYaml(fs.readFileSync(dotspath, 'utf-8'));
  // 合并base yaml
  return extend2(true, {}, baseYamlData, parsedData);
}

export async function transforYamlPath(spath: string = '') {
  await isYamlFile(spath);
  await setupEnv(spath);
  const data = await getYamlContent(spath);
  // 兼容 extends 只取第一个即可
  if (isEmpty(data?.extends) && isEmpty(data?.extend)) {
    return checkYaml(spath);
  }
  const dotspath = path.join(path.dirname(spath), '.s', path.basename(spath));
  fs.ensureFileSync(dotspath);
  const newData = await extendsYaml(spath, dotspath);
  fs.writeFileSync(dotspath, yaml.dump(omit(newData, ['extends', 'extend'])));
  return checkYaml(dotspath);
}

export async function getTemplatePath(spath: string = '') {
  if (fs.existsSync(spath)) {
    return path.isAbsolute(spath) ? spath : path.resolve(spath);
  }
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (fs.existsSync(sYamlPath)) return sYamlPath;
  const sYmlPath = path.join(cwd, 's.yml');
  if (fs.existsSync(sYmlPath)) return sYmlPath;
  throw new Error(
    JSON.stringify({
      message: 'the s.yaml/s.yml file was not found.',
      tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
    }),
  );
}
