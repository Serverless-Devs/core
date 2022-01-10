import fs from 'fs-extra';
import { endsWith, isEmpty } from 'lodash';
import getYamlContent from '../getYamlContent';
import path from 'path';
import HumanError from '../../error/HumanError';
import chalk from 'chalk';

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
