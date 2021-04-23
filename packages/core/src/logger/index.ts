import { Logger as MyLogger } from '@tsed/logger';
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

export const logger = (name: string): ILogger => {
  const loggers = new MyLogger(name);
  const args = minimist(process.argv.slice(2));
  const debug = args.debug || process.env?.temp_params?.includes('--debug');
  const stdLog = loggers.appenders.set('std-log', {
    type: 'stdout',
    layout: { type: 'colored' },
    levels: (debug ? ['debug'] : []).concat(['info', 'warn', 'error', 'fatal']),
  });

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

  // @ts-ignore
  loggers.log = (message: any, color?: LogColor) => {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  };
  // @ts-ignore
  return loggers;
};

export class Logger {
  context: string;
  constructor(context?: string) {
    this.context = context;
  }
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
  log(message: any, color?: LogColor) {
    return process.stdout.write(`${color ? chalk[color](message) : message}\n`);
  }

  debug(data) {
    const Loggers = logger(this.context);
    Loggers.debug(data);
  }

  info(data) {
    const Loggers = logger(this.context);
    Loggers.info(data);
  }

  warn(data) {
    const Loggers = logger(this.context);
    Loggers.warn(data);
  }

  error(data) {
    const Loggers = logger(this.context);
    Loggers.error(data);
  }
}

// refer https://logger.tsed.io/getting-started.html#installation
