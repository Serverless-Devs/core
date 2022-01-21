/**
 * @description 用于存放工具函数
 */

import * as fs from 'fs-extra';
import { IGlobalParams } from '../interface';
import { isEmpty, trim, startsWith, assign, filter, find, join } from 'lodash';
import minimist from 'minimist';
import chalk from 'chalk';

export const makeUnderLine = (text: string) => {
  const matchs = text.match(/http[s]?:\/\/[^\s]+/);
  if (matchs) {
    return text.replace(matchs[0], chalk.underline(matchs[0]));
  } else {
    return text;
  }
};

export function getServerlessDevsTempArgv() {
  try {
    return JSON.parse(process.env.serverless_devs_temp_argv);
  } catch (error) {
    return [];
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
  const filterArgs = filter(args, (item) => !find(data._, (o) => o === item));
  return assign({}, data, temp, {
    _args: join(filterArgs, ' '),
    _argsObj,
  });
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
