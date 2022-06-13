import path from 'path';
import fs from 'fs-extra';
import { getYamlContent } from '../../libs';
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
    require('dotenv').config({ path: path.join(spath, '.env') });
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

async function isYamlFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} file was not found.`);
  }
  const arr = ['.yaml', '.yml'];
  if (!arr.includes(path.extname(filePath))) {
    throw new Error(`${filePath} file should be yaml or yml file.`);
  }
  try {
    await yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const filename = path.basename(filePath);
    throw new Error(
      JSON.stringify({
        message: `${filename} format is incorrect`,
        tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
          'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
        )}`,
      }),
    );
  }
}

async function extendsYaml(spath: string, dotspath: string, data: any) {
  const extendsPath = data?.extends ? first(data.extends) : undefined;
  let yamlPath = data?.extend ? data.extend : extendsPath;
  if (isEmpty(yamlPath)) return;

  if (!path.isAbsolute(yamlPath)) {
    let dirname = path.dirname(spath);
    let fixedPath = path.resolve(dirname, yamlPath);
    if (fs.existsSync(fixedPath)) yamlPath = fixedPath;
  }

  await isYamlFile(yamlPath);
  if (data?.vars) {
    const doc = await getYamlContent(yamlPath);
    const newData = extend2(true, doc, { vars: data.vars });
    fs.writeFileSync(dotspath, yaml.dump(newData));
    return await parseYaml(fs.readFileSync(dotspath, 'utf-8'));
  }
  return await parseYaml(fs.readFileSync(yamlPath, 'utf-8'));
}

export async function transforYamlPath(spath: string = '') {
  await isYamlFile(spath);
  await setupEnv(spath);

  const data = await parseYaml(fs.readFileSync(spath, 'utf-8'));
  // 兼容 extends 只取第一个即可
  if (isEmpty(data?.extends) && isEmpty(data?.extend)) {
    return checkYaml(spath);
  }
  const dotspath = path.join(path.dirname(spath), '.s', path.basename(spath));
  fs.ensureFileSync(dotspath);

  const tmp = await extendsYaml(spath, dotspath, data);
  const extend2Data = extend2(true, tmp, omit(data, ['extends', 'extend']));
  fs.writeFileSync(dotspath, yaml.dump(extend2Data));
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
