import path from 'path';
import fs from 'fs-extra';
import { getYamlContent, getConfig } from '../../libs';
import { isEmpty, endsWith, get } from 'lodash';
import yaml from 'js-yaml';
import chalk from 'chalk';
import extend2 from 'extend2';
import { humanWarning } from './utils';

async function validateTemplateFile(spath: string): Promise<boolean> {
  if (!fs.existsSync(spath)) return false;
  const filename = path.basename(spath);
  if (endsWith(spath, 'yaml') || endsWith(spath, 'yml')) {
    let data = {};
    try {
      data = await yaml.load(fs.readFileSync(spath, 'utf8'));
    } catch (error) {
      throw new Error(
        JSON.stringify({
          message: `${filename} format is incorrect`,
          tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
          )}`,
        }),
      );
    }
    if (['1.0.0', '2.0.0'].includes(get(data, 'edition'))) {
      return true;
    }
    throw new Error(
      JSON.stringify({
        message: `The edtion field in the ${filename} file is incorrect.`,
        tips: `Please check the edtion field of ${filename}, you can specify it as 1.0.0 or 2.0.0.`,
      }),
    );
  }
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

export async function getTemplatePathWithEnv(config: { spath: string; env?: string }) {
  await setupEnv(config.spath);
  let tempEnv: string = config.env;
  if (isEmpty(tempEnv)) {
    tempEnv = process.env['SERVERLESS_DEVS_ENV'];
  }
  if (isEmpty(tempEnv)) {
    tempEnv = getConfig('env');
  }
  if (isEmpty(tempEnv)) return config.spath;
  const sdir = path.dirname(config.spath);
  const tempEnvYamlPath = path.join(sdir, `s.${tempEnv}.yaml`);
  const tempEnvYamlData = await getYamlContent(tempEnvYamlPath);
  if (isEmpty(tempEnvYamlData)) {
    humanWarning('xxx');
  }
  const extend2Data = extend2(true, await getYamlContent(config.spath), tempEnvYamlData);
  const tempPath = path.join(sdir, '.s', `s.${tempEnv}.yaml`);
  fs.writeFileSync(tempPath, yaml.dump(extend2Data));
  return tempPath;
}

export async function getTemplatePath(spath: string = '') {
  const filePath = path.isAbsolute(spath) ? spath : path.resolve(spath);
  if (await validateTemplateFile(filePath)) return filePath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (await validateTemplateFile(sYamlPath)) return sYamlPath;
  const sYmlPath = path.join(cwd, 's.yml');
  if (await validateTemplateFile(sYmlPath)) return sYmlPath;
  throw new Error(
    JSON.stringify({
      message: 'the s.yaml/s.yml file was not found.',
      tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
    }),
  );
}
