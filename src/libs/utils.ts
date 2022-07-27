/**
 * @description 用于存放工具函数
 */

import * as fs from 'fs-extra';
import { IGlobalParams } from '../interface';
import { isEmpty, trim, startsWith, assign } from 'lodash';
import minimist from 'minimist';
import chalk from 'chalk';
import net from 'net';

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
  if (isEmpty(args)) return { _: [] };
  const newArgs = [];
  const _argsObj = [];
  let lastVal: string;
  let nextRemove: boolean;
  for (const index in args) {
    const val = trim(args[index]);
    // 将参数放到_argsObj, - 或者 -- 开头
    if (startsWith(val, '-') || _argsObj.length > 0) {
      _argsObj.push(val);
    }
    if (nextRemove) {
      nextRemove = false;
      continue;
    }
    if (/\s/.test(val) && startsWith(lastVal, '-')) {
      // 对包含空格的参数 单独处理
      newArgs.pop();
    } else if (startsWith(val, '-') && !startsWith(val, '--') && val.length > 2) {
      // 对类似 -la 的参数 单独处理
      nextRemove = true;
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
    string: ['access', 'template', 'env'],
    boolean: ['debug', 'skip-actions', 'help', 'version'],
  });
  return assign({ _argsObj }, data);
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

export function getAvailablePort(port: number = 3000) {
  const server = net.createServer().listen(port);
  return new Promise((resolve, reject) => {
    server.on('listening', () => {
      server.close();
      resolve(port);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(port + 1));
      } else {
        reject(err);
      }
    });
  });
}

// 生成随机数
export function generateRandom() {
  return Math.random().toString(36).substring(2, 6);
}
