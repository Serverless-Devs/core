/**
 * @description 用于存放工具函数
 */

import * as fs from 'fs-extra';
import { IGlobalParams } from '../interface';
import { split } from 'lodash';
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

export function transformGlobalArgs(args: string): IGlobalParams {
  const data = minimist(split(args, ' '), {
    alias: {
      access: 'a',
    },
    boolean: ['debug', 'skip-actions'],
  });
  return {
    access: data.access,
    debug: data.debug,
    skipActions: data['skip-actions'],
  };
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
