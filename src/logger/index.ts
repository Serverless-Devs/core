import chalk from 'chalk';
import path from 'path';
const prettyjson = require('prettyjson');
import ansiEscapes from 'ansi-escapes';
import ora, { Ora } from 'ora';
import { isDebugMode, getRootHome, getPid, isCiCdEnv } from '../libs';
import { isFunction } from 'lodash';
import fs from 'fs-extra';
import { execDaemon } from '../execDaemon';
// CLI Colors
const white = (str) => `${str}\n`;

type LogColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'whiteBright'
  | 'gray';

export interface ILogger {
  // 打印
  log: (message: any, color?: LogColor) => any;
  // 当成日志
  info: (...data: any[]) => any;
  debug: (...data: any[]) => any;
  warn: (...data: any[]) => any;
  error: (...data: any[]) => any;
  output: (outputs: any, indent?: number) => any;
  task: (title: string, option: ITaskOptions[]) => boolean;
}

interface ITaskOptions {
  title: string | Function;
  id?: string;
  task: Function;
  enabled?: Function;
}

const getLogPath = () => {
  const serverless_devs_log_path = process.env['serverless_devs_log_path'];
  if (serverless_devs_log_path) {
    if (fs.existsSync(serverless_devs_log_path)) {
      const stat = fs.statSync(serverless_devs_log_path);
      if (stat.isFile()) return serverless_devs_log_path;
      if (isCiCdEnv()) return;
      return path.join(serverless_devs_log_path, `${process.env['serverless_devs_trace_id']}.log`);
    }
  }
  if (isCiCdEnv()) return;
  const logDirPath = path.join(getRootHome(), 'logs');
  fs.ensureDirSync(logDirPath);
  return path.join(logDirPath, `${process.env['serverless_devs_trace_id']}.log`);
};

export const makeLogFile = () => {
  process.env['serverless_devs_trace_id'] = `${getPid()}${Date.now()}`;
  const filePath = getLogPath();
  if (filePath) {
    execDaemon('logger.js');
  }
};

function searchStr(data: string, str: string) {
  const arr = [];
  let index = data.indexOf(str);
  while (index > -1) {
    arr.push(index);
    index = data.indexOf(str, index + 1);
  }
  return arr;
}

function formatDebugData(data: string) {
  try {
    const AccountIDs = searchStr(data, 'AccountID');
    AccountIDs.forEach((index) => {
      data = data.slice(0, index + 16) + '*'.repeat(10) + data.slice(index + 16 + 10);
    });
    const AccessKeyIDs = searchStr(data, 'AccessKeyID');
    AccessKeyIDs.forEach((index) => {
      data = data.slice(0, index + 18) + '*'.repeat(18) + data.slice(index + 18 + 18);
    });
    const AccessKeySecrets = searchStr(data, 'AccessKeySecret');
    AccessKeySecrets.forEach((index) => {
      data = data.slice(0, index + 22) + '*'.repeat(24) + data.slice(index + 22 + 24);
    });
    const SecretAccessKey = searchStr(data, 'SecretAccessKey');
    SecretAccessKey.forEach((index) => {
      data = data.slice(0, index + 22) + '*'.repeat(30) + data.slice(index + 22 + 30);
    });
    return data;
  } catch (error) {
    return data;
  }
}

const gray = chalk.hex('#8c8d91');
const red = chalk.hex('#fd5750');

function fill0(value: number) {
  return value < 10 ? `0${value}` : value;
}

function time() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${fill0(month)}-${fill0(day)} ${fill0(hour)}:${fill0(minute)}:${fill0(second)}`;
}

const getName = (name) => (name ? ` [${name}]` : '');

function strip(value: string) {
  const reg = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return typeof value === 'string' ? `\n${value.replace(reg, '')}` : `\n${value}`;
}

function logWrite(data) {
  const filePath = getLogPath();
  if (filePath) {
    const instance = fs.createWriteStream(filePath, { flags: 'a' });
    instance.write(strip(data));
  }
}

export class Logger {
  spinner: Ora;
  context: string;
  constructor(context?: string) {
    this.context = getName(context);
  }
  static log(message: any, color?: LogColor) {
    logWrite(message);
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    const tmp = formatDebugData(data);
    const newData = `${gray(`[${time()}] [DEBUG]${getName(name)} - `)}${tmp}`;
    if (process.env['serverless_devs_log_debug'] !== 'false') {
      logWrite(newData);
    }
    if (isDebugMode()) {
      console.log(newData);
    }
  }

  static info(name: string, data) {
    const newData = `${chalk.green(`[${time()}] [INFO]${getName(name)} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }

  static warn(name: string, data) {
    const newData = `${chalk.yellow(`[${time()}] [WARN]${getName(name)} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }

  static error(name: string, data) {
    const newData = `${chalk.red(`[${time()}] [ERROR]${getName(name)} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }
  log(message: any, color?: LogColor) {
    logWrite(message);
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    const tmp = formatDebugData(data);
    const newData = `${gray(`[${time()}] [DEBUG]${this.context} - `)}${tmp}`;
    if (process.env['serverless_devs_log_debug'] !== 'false') {
      logWrite(newData);
    }
    if (isDebugMode()) {
      console.log(newData);
    }
  }

  info(data) {
    const newData = `${chalk.green(`[${time()}] [INFO]${this.context} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }

  warn(data) {
    const newData = `${chalk.yellow(`[${time()}] [WARN]${this.context} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }

  error(data) {
    const newData = `${chalk.red(`[${time()}] [ERROR]${this.context} - `)}${data}`;
    logWrite(newData);
    console.log(newData);
  }

  output(outputs, indent = 0) {
    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout.write(
      white(
        prettyjson.render(
          outputs,
          {
            keysColor: 'bold',
            dashColor: null,
            numberColor: null,
            stringColor: null,
            trueColor: null,
            falseColor: null,
          },
          indent,
        ),
      ),
    );
  }

  async task(title: string, list: ITaskOptions[]) {
    let err: Error;
    const plist = [];
    const startTime = Date.now();
    for (const item of list) {
      const enabled = typeof item.enabled === 'function' ? item.enabled() : true;
      if (!enabled) {
        continue;
      }
      if (item.title && item.task) {
        const title = isFunction(item.title) ? item.title() : item.title;
        if (isDebugMode()) {
          this.log(gray(title));
          try {
            await item.task();
            plist.push(Object.assign(item, { valid: true }));
          } catch (error) {
            err = error;
            plist.push(Object.assign(item, { valid: false, error }));
            break;
          }
        } else {
          this.spinner = ora();
          this.spinner.start(gray(title));
          try {
            await item.task(this.spinner);
            this.spinner.stop();
            plist.push(Object.assign(item, { valid: true }));
          } catch (error) {
            this.spinner.stop();
            err = error;
            plist.push(Object.assign(item, { valid: false, error }));
            break;
          }
        }
      }
    }
    if (plist.length === 0) return;
    const endTime = Date.now();

    const time = (Math.round((endTime - startTime) / 10) * 10) / 1000;

    const getOraMsg = () => {
      const arr = plist.filter((item) => item.id).map((item) => item.id);
      if (arr.length === 0) return `${title} (${time}s)`;
      return `${title} ${arr.join(', ')} (${time}s)`;
    };

    if (plist.every((obj) => obj.valid)) {
      endTime - startTime > 5 && ora().succeed(getOraMsg());
    } else {
      this.log(`${red('✖')} ${getOraMsg()}`);
      throw err;
    }
  }
}

export const logger = new Logger('S-CORE');
