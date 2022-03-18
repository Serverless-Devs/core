import path from 'path';
import fs from 'fs-extra';
import { getYamlContent } from '../../libs';
import { isEmpty, get, omit, first } from 'lodash';
import yaml from 'js-yaml';
import chalk from 'chalk';
import extend2 from 'extend2';
import parseYaml from '../parseYaml';

async function checkEdition(spath: string) {
  const filename = path.basename(spath);
  const data = await getYamlContent(spath);
  if (['1.0.0', '2.0.0'].includes(get(data, 'edition'))) {
    return spath;
  }
  throw new Error(
    JSON.stringify({
      message: `The edtion field in the ${filename} file is incorrect.`,
      tips: `Please check the edtion field of ${filename}, you can specify it as 1.0.0 or 2.0.0.`,
    }),
  );
}

async function setupEnv(templateFile: string) {
  const spath = path.dirname(templateFile);
  require('dotenv').config({ path: path.join(spath, '.env') });
  const data = await getYamlContent(templateFile);
  const { services } = data;
  for (const key in services) {
    const element = services[key];
    let codeUri = get(element, 'props.function.codeUri');
    if (codeUri) {
      codeUri = path.isAbsolute(codeUri) ? codeUri : path.join(spath, codeUri);
      require('dotenv').config({ path: path.join(codeUri, '.env') });
    }
  }
}

async function isYamlFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} file was not found.`);
  }
  const arr = ['.yaml', '.yaml'];
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

async function extendsYaml(dotspath: string, data: any) {
  const extendsPath = data?.extends ? first(data.extends) : undefined;
  const yamlPath = data?.extend ? data.extend : extendsPath;
  if (isEmpty(yamlPath)) return;
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
    return checkEdition(spath);
  }
  const dotspath = path.join(path.dirname(spath), '.s', path.basename(spath));
  fs.ensureFileSync(dotspath);

  const tmp = await extendsYaml(dotspath, data);
  const extend2Data = extend2(true, tmp, omit(data, ['extends', 'extend']));
  fs.writeFileSync(dotspath, yaml.dump(extend2Data));
  return checkEdition(dotspath);
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
