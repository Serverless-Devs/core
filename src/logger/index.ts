import chalk from 'chalk';
import minimist from 'minimist';
import get from 'lodash.get';
const prettyoutput = require('prettyoutput');
import ansiEscapes from 'ansi-escapes';
import ora from 'ora';

// CLI Colors
const white = (str) => str;

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

function getDebugFromEnv() {
  const temp_params = get(process, 'env.temp_params');
  if (temp_params) {
    const temp = temp_params.split(' ');
    const debugList = temp.filter((item) => item === '--debug');
    return debugList.length > 0;
  }
}

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
  title: string;
  task: () => Promise<any>;
}

const args = minimist(process.argv.slice(2));
const getEnableDebug = () => args.debug || getDebugFromEnv();

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
const bgRed = chalk.hex('#000').bgHex('#fd5750');

const time = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
export class Logger {
  context: string;
  constructor(context?: string) {
    this.context = context;
  }
  static log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    if (getEnableDebug()) {
      console.log(`${gray(`[${time()}] [DEBUG] [${name}] - `)}${data}`);
    }
  }

  static info(name: string, data) {
    console.log(`${chalk.green(`[${time()}] [INFO] [${name}] - `)}${data}`);
  }

  static warn(name: string, data) {
    console.log(`${chalk.yellow(`[${time()}] [WARN] [${name}] - `)}${data}`);
  }

  static error(name: string, data) {
    console.log(`${chalk.red(`[${time()}] [ERROR] [${name}] - `)}${data}`);
  }
  log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    if (getEnableDebug()) {
      data = formatDebugData(data);
      console.log(`${gray(`[${time()}] [DEBUG] [${this.context}] - `)}${data}`);
    }
  }

  info(data) {
    console.log(`${chalk.green(`[${time()}] [INFO] [${this.context}] - `)}${data}`);
  }

  warn(data) {
    console.log(`${chalk.yellow(`[${time()}] [WARN] [${this.context}] - `)}${data}`);
  }

  error(data) {
    console.log(`${chalk.red(`[${time()}] [ERROR] [${this.context}] - `)}${data}`);
  }

  output(outputs, indent = 0) {
    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout.write(
      white(
        prettyoutput(
          outputs,
          {
            colors: {
              keys: 'bold',
              dash: null,
              number: null,
              string: null,
              true: null,
              false: null,
            },
            maxDepth: 10,
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
    const plist = [];
    const startTime = Date.now();
    for (const item of list) {
      if (item.title && item.task) {
        if (getEnableDebug()) {
          this.log(gray(item.title));
          try {
            await item.task();
            plist.push(true);
          } catch (error) {
            const index = error.stack.indexOf(':');
            this.log(bgRed(error.stack.slice(0, index + 1)) + error.stack.slice(index + 1));
            plist.push(false);
            break;
          }
        } else {
          const vm = ora(gray(item.title)).start();
          try {
            await item.task();
            vm.stop();
            plist.push(true);
          } catch (error) {
            vm.stop();
            plist.push(false);
            break;
          }
        }
      }
    }
    const endTime = Date.now();

    const time = Math.round((endTime - startTime) / 1000);

    if (plist.every((obj) => obj)) {
      ora().succeed(`${title} succeed (${time}s)`);
      return true;
    } else {
      ora().fail(`${title} fail (${time}s)`);
      return false;
    }
  }
  static async task(title: string, list: ITaskOptions[]) {
    await this.task(title, list);
  }
}
