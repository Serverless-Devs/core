import { Logger as MyLogger, $log } from '@tsed/logger';
import chalk from 'chalk';
import { S_ROOT_HOME } from '../libs/common';
import minimist from 'minimist';
import get from 'lodash.get';

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
}
const args = minimist(process.argv.slice(2));
const enableDebug = args.debug || getDebugFromEnv();

function getSecretValue(val: string) {
  const [key, value] = val.split(': ');
  const valueLength = value.length;
  if (valueLength < 6) return val;

  let formatVal = value.slice(0, 4);
  for (let i = 0; i < valueLength - 10; i++) {
    formatVal += '*';
  }
  formatVal += value.slice(valueLength - 6, valueLength);
  return `${key}: ${formatVal}`;
}

function secretCredentials(...data: any[]) {
  const list = [];
  for (const iterator of data) {
    if (typeof iterator.includes !== 'function') return data;
    let str = iterator;
    if (iterator.includes('AccountID')) {
      const reg = /"AccountID(.*?)\n/g;
      const arr = iterator.match(reg);
      if (!arr) return;
      arr &&
        arr.forEach((item) => {
          str = str.replace(item, getSecretValue(item));
        });
    }
    if (iterator.includes('AccessKeyID')) {
      const reg = /"AccessKeyID(.*?)\n/g;
      const arr = iterator.match(reg);
      arr &&
        arr.forEach((item) => {
          str = str.replace(item, getSecretValue(item));
        });
    }
    if (iterator.includes('AccessKeySecret')) {
      const reg = /"AccessKeySecret(.*?)\n/g;
      const arr = iterator.match(reg);
      arr &&
        arr.forEach((item) => {
          str = str.replace(item, getSecretValue(item));
        });
    }
    list.push(str);
  }
  return list;
}

export const logger = (name: string): ILogger => {
  const loggers = new MyLogger(name);
  const stdLog = loggers.appenders.set('std-log', {
    type: 'stdout',
    layout: { type: 'colored' },
    levels: (enableDebug ? ['debug'] : []).concat(['info', 'warn', 'error', 'fatal']),
  });

  try {
    stdLog.set('app-file', {
      type: 'file',
      filename: `${S_ROOT_HOME}/logs/app.log`,
      levels: ['trace', 'info', 'warn', 'error', 'fatal'],
      pattern: '.yyyy-MM-dd',
      layout: {
        type: 'json',
        separator: ',',
      },
    });
    stdLog.set('app-debug-file', {
      type: 'file',
      filename: `${S_ROOT_HOME}/logs/app-debug.log`,
      levels: ['debug'],
      pattern: '.yyyy-MM-dd',
      layout: {
        type: 'json',
        separator: ',',
      },
    });
  } catch (e) {}

  // @ts-ignore
  loggers.log = (message: any, color?: LogColor) => {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  };

  // @ts-ignore
  loggers.mydebug = loggers.debug;
  loggers.debug = (...data: any[]): MyLogger => {
    const list = secretCredentials(...data);
    // @ts-ignore
    loggers.mydebug(...list);
    return loggers;
  };

  // @ts-ignore
  return loggers;
};

export class Logger {
  context: string;
  Loggers: ILogger;
  constructor(context?: string) {
    this.context = context;
    this.Loggers = logger(context);
  }
  static log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    if (enableDebug) {
      $log.name = name;
      const list = secretCredentials(data);
      $log.debug(...list);
    }
  }

  static info(name: string, data) {
    $log.name = name;
    $log.info(data);
  }

  static warn(name: string, data) {
    $log.name = name;
    $log.warn(data);
  }

  static error(name: string, data) {
    $log.name = name;
    $log.error(data);
  }
  log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    this.Loggers.debug(data);
  }

  info(data) {
    this.Loggers.info(data);
  }

  warn(data) {
    this.Loggers.warn(data);
  }

  error(data) {
    this.Loggers.error(data);
  }
}

// refer https://logger.tsed.io/getting-started.html#installation
