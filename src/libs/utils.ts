/**
 * @description 用于存放工具函数
 */

import * as fs from 'fs-extra';
import { IGlobalParams } from '../interface';
import { isEmpty, trim, startsWith, assign, endsWith } from 'lodash';
import minimist from 'minimist';
import chalk from 'chalk';
import path from 'path';
import getYamlContent from './getYamlContent';

export const makeUnderLine = (text: string) => {
  const matchs = text.match(/http[s]?:\/\/[^\s|,]+/);
  if (matchs) {
    return text.replace(matchs[0], chalk.underline(matchs[0]));
  } else {
    return text;
  }
};

export function getServerlessDevsTempArgv(): any {
  const { serverless_devs_temp_argv } = process.env;
  if (isEmpty(serverless_devs_temp_argv)) {
    return {};
  }
  try {
    const tempArgv = JSON.parse(serverless_devs_temp_argv);
    return getGlobalArgs(tempArgv);
  } catch (error) {
    return {};
  }
}

export function getGlobalArgs(args: string[]): IGlobalParams {
  if (isEmpty(args)) return;
  const newArgs = [];
  const temp = {};
  const _argsObj = [];
  let lastVal: string;
  for (const index in args) {
    const val = trim(args[index]);
    // 将参数放到_argsObj
    if (startsWith(val, '-') || _argsObj.length > 0) {
      _argsObj.push(val);
    }
    // 对包含空格的参数 单独处理
    if (/\s/.test(val) && startsWith(lastVal, '-')) {
      const key = lastVal.slice(startsWith(lastVal, '--') ? 2 : 1);
      temp[key] = val;
      newArgs.pop();
    } else {
      newArgs.push(val);
    }
    lastVal = val;
  }
  const data = minimist(newArgs, {
    alias: {
      template: 't',
      access: 'a',
      help: 'h',
      version: 'v',
    },
    string: ['access', 'template'],
    boolean: ['debug', 'skip-actions', 'help', 'version'],
  });
  return assign({ _argsObj }, data, temp);
}

export function readJsonFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    try {
      return JSON.parse(data);
    } catch (error) {}
  }
}

export function writeJsonFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

async function validateTemplateFile(spath: string): Promise<boolean> {
  if (isEmpty(spath)) return false;
  if (endsWith('json')) {
    const data = fs.readJSONSync(spath);
    return data.hasOwnProperty('edition');
  }

  if (endsWith(spath, 'yaml') || endsWith(spath, 'yml')) {
    try {
      const data = await getYamlContent(spath);
      return data && data.hasOwnProperty('edition');
    } catch (error) {
      const filename = path.basename(spath);
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
}

export async function getTemplatePath(spath: string = '') {
  const filePath = path.isAbsolute(spath) ? spath : path.resolve(spath);
  if (await validateTemplateFile(filePath)) return filePath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (await validateTemplateFile(sYamlPath)) return sYamlPath;
  const sJsonPath = path.join(cwd, 's.json');
  if (await validateTemplateFile(sJsonPath)) return sJsonPath;
  throw new Error(
    JSON.stringify({
      message: 'the s.yaml/s.yml file was not found.',
      tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
    }),
  );
}
