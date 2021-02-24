import { Logger as MyLogger } from '@tsed/logger';
import chalk from 'chalk';
import {
  S_ROOT_HOME,
  S_CURRENT_HOME_S,
  S_CURRENT_HOME_TEMPLATE,
  S_CURRENT_HOME_PACKAGE,
} from '../libs/common';
import { readJsonFile } from '../libs/utils';
import minimist from 'minimist';
import fs from 'fs';
import yaml from 'js-yaml';

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
}

export const logger = (name: string): ILogger => {
  const loggers = new MyLogger(name);
  const args = minimist(process.argv.slice(2));
  let logName: string;
  try {
    const content = yaml.safeLoad(fs.readFileSync(S_CURRENT_HOME_S, 'utf8'));
    logName = content.name || content.Name;
  } catch (error) {
    // ignore exception
  }

  if (!logName) {
    try {
      const content = yaml.safeLoad(fs.readFileSync(S_CURRENT_HOME_TEMPLATE, 'utf8'));
      logName = content.name || content.Name;
    } catch (error) {
      // ignore exception
    }
  }

  if (!logName) {
    try {
      const content: any = readJsonFile(S_CURRENT_HOME_PACKAGE);
      logName = content.name;
    } catch (error) {
      // ignore exception
    }
  }

  const stdLog = loggers.appenders.set('std-log', {
    type: 'stdout',
    layout: { type: 'colored' },
    level: (args.debug ? ['debug'] : []).concat(['info', 'warn', 'error', 'fatal']),
  });

  logName &&
    stdLog.set('all-log-file', {
      type: 'file',
      filename: `${S_ROOT_HOME}/logs/${logName}/app.log`,
      level: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      pattern: '.yyyy-MM-dd',
      maxLogSize: 5,
      layout: {
        type: 'json',
        separator: ',',
      },
    });

  // @ts-ignore
  loggers.log = (message: any, color?: LogColor) => {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  };
  // @ts-ignore
  return loggers;
};

export class Logger {
  static log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  static debug(name: string, data) {
    const Loggers = logger(name);
    Loggers.debug(data);
  }

  static info(name: string, data) {
    const Loggers = logger(name);
    Loggers.info(data);
  }

  static warn(name: string, data) {
    const Loggers = logger(name);
    Loggers.warn(data);
  }

  static error(name: string, data) {
    const Loggers = logger(name);
    Loggers.error(data);
  }
}

// refer https://logger.tsed.io/getting-started.html#installation
