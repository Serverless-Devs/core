import chalk from 'chalk';
const prettyjson = require('prettyjson');
import ansiEscapes from 'ansi-escapes';
import ora, { Ora } from 'ora';
import { isDebugMode } from '../libs/common';
import { isEmpty, isFunction } from 'lodash';

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
    return data;
  } catch (error) {
    return data;
  }
}

const gray = chalk.hex('#8c8d91');
const red = chalk.hex('#fd5750');

const time = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
const getName = name =>  name ? ` [${name}]` : '';

export class Logger {
  spinner: Ora;
  context: string;
  constructor(context?: string) {
    this.context = getName(context);
  }
  static log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    if (isDebugMode()) {
      console.log(`${gray(`[${time()}] [DEBUG]${getName(name)} - `)}${data}`);
    }
  }

  static info(name: string, data) {
    console.log(`${chalk.green(`[${time()}] [INFO]${getName(name)} - `)}${data}`);
  }

  static warn(name: string, data) {
    console.log(`${chalk.yellow(`[${time()}] [WARN]${getName(name)} - `)}${data}`);
  }

  static error(name: string, data) {
    console.log(`${chalk.red(`[${time()}] [ERROR]${getName(name)} - `)}${data}`);
  }
  log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    if (isDebugMode()) {
      data = formatDebugData(data);
      console.log(`${gray(`[${time()}] [DEBUG]${this.context} - `)}${data}`);
    }
  }

  info(data) {
    console.log(`${chalk.green(`[${time()}] [INFO]${this.context} - `)}${data}`);
  }

  warn(data) {
    console.log(`${chalk.yellow(`[${time()}] [WARN]${this.context} - `)}${data}`);
  }

  error(data) {
    console.log(`${chalk.red(`[${time()}] [ERROR]${this.context} - `)}${data}`);
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

  static output(outputs, indent = 0) {
    this.output(outputs, indent);
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
          isEmpty(!this.spinner) && (this.spinner = ora());
          this.spinner.start(gray(title))
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
    this.spinner?.stop();
    this.spinner = null;
    if(plist.length === 0) return;
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
      this.log(`${red('✖') } ${getOraMsg()}`);
      throw err;
    }
  }

  static task(title: string, list: ITaskOptions[]) {
    this.task(title, list);
  }
}
