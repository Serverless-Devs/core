import { Logger as MyLogger, $log } from '@tsed/logger';
import chalk from 'chalk';
import { S_ROOT_HOME } from '../libs/common';
import minimist from 'minimist';

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
const args = minimist(process.argv.slice(2));
const enableDebug = args.debug || process.env?.temp_params?.includes('--debug');

export const logger = (name: string): ILogger => {
  const loggers = new MyLogger(name);
  const stdLog = loggers.appenders.set('std-log', {
    type: 'stdout',
    layout: { type: 'colored' },
    levels: (enableDebug ? ['debug'] : []).concat(['info', 'warn', 'error', 'fatal']),
  });

  try{
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
  }catch (e){

  }

  // @ts-ignore
  loggers.log = (message: any, color?: LogColor) => {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
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
      $log.debug(data);
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
