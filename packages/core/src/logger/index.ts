import { Logger as MyLogger } from '@tsed/logger';
import chalk from 'chalk';
import { S_CURRENT_HOME } from '../libs/common';
import minimist from 'minimist';
import fs from 'fs';
import yaml from 'js-yaml';
const path = require('path');

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

function getProjectName() {
  function readContent(file: string) {
    const content = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    return Object.keys(content)[0];
  }
  const args = minimist(process.argv.slice(2));
  const templte = args.t || args.template;
  if (templte) {
    const templteFile = path.join(process.cwd(), templte);
    if (fs.existsSync(templteFile)) {
      return readContent(templteFile);
    }
  }

  const s_yaml = path.join(process.cwd(), 's.yaml');
  if (fs.existsSync(s_yaml)) {
    return readContent(s_yaml);
  }
  const s_yml = path.join(process.cwd(), 's.yml');
  if (fs.existsSync(s_yml)) {
    return readContent(s_yml);
  }
  const template_yaml = path.join(process.cwd(), 'template.yaml');
  if (fs.existsSync(template_yaml)) {
    return readContent(template_yaml);
  }
  const template_yml = path.join(process.cwd(), 'template.yml');
  if (fs.existsSync(template_yml)) {
    return readContent(template_yml);
  }
}

export const logger = (name: string): ILogger => {
  const loggers = new MyLogger(name);
  const args = minimist(process.argv.slice(2));
  const debug = args.debug || process.env?.temp_params?.includes('--debug');
  const projectName = getProjectName();
  const stdLog = loggers.appenders.set('std-log', {
    type: 'stdout',
    layout: { type: 'colored' },
    levels: (debug ? ['debug'] : []).concat(['info', 'warn', 'error', 'fatal']),
  });

  projectName &&
    stdLog.set('all-log-file', {
      type: 'file',
      filename: `${S_CURRENT_HOME}/logs/${projectName}.log`,
      levels: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
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
