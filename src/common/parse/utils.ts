import fs from 'fs-extra';
import { endsWith, isEmpty, get, assign } from 'lodash';
import getYamlContent from '../getYamlContent';
import path from 'path';
import HumanError from '../../error/HumanError';
import chalk from 'chalk';
import { IProjectConfig } from './interface';

async function validateTemplateFile(spath: string): Promise<boolean> {
  if (isEmpty(spath)) return false;
  try {
    if (endsWith('json')) {
      const data = fs.readJSONSync(spath);
      return data.hasOwnProperty('edition');
    }
    if (endsWith(spath, 'yaml') || endsWith(spath, 'yml')) {
      const data = await getYamlContent(spath);
      if (isEmpty(data)) {
        const filename = path.basename(spath);
        new HumanError({
          errorMessage: `${filename} format is incorrect`,
          tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
          )}`,
        });
        process.exit(1);
      }
      return data.hasOwnProperty('edition');
    }
  } catch (error) {
    return false;
  }
}

export async function getTemplatePath(spath: string) {
  if (await validateTemplateFile(spath)) return spath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (await validateTemplateFile(sYamlPath)) return sYamlPath;
  const sJsonPath = path.join(cwd, 's.json');
  if (await validateTemplateFile(sJsonPath)) return sJsonPath;
}

export async function setupEnv(templateFile: string) {
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

export function getProjectConfig(realVariables: any, serviceName: string): IProjectConfig {
  const services = get(realVariables, 'services', {});
  const data = services[serviceName];
  const provider = data.provider || realVariables.provider;
  const access = data.access || realVariables.access;
  return assign({}, data, {
    access,
    provider,
    appName: realVariables.name,
    serviceName,
  });
}
