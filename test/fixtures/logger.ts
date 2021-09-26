// @ts-nocheck
import { HLogger } from '../../src';
import { Logger, ILogger } from '../../src/logger';

const input = {
  Credentials: {
    Alias: 'default',
    AccountID: '1234567890123456',
    AccessKeyID: 'abcdefghijklmnopqrstuvwx',
    AccessKeySecret: 'abcdefghijklmnopqrstuvwxyzabcd',
  },
  credentials: {
    Alias: 'default',
    AccountID: '1234567890123456',
    AccessKeyID: 'abcdefghijklmnopqrstuvwx',
    AccessKeySecret: 'abcdefghijklmnopqrstuvwxyzabcd',
  },
  appName: 'appName',
  Path: {
    ConfigPath: '/Users/shihuali/workspace/jamstack-api/example/s.yaml',
  },
};

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  async getDefaultLog() {
    this.logger.debug(JSON.stringify(input));
    this.logger.log('some log message ')
    this.logger.info('info message')
    this.logger.warn('warn message')
    this.logger.error('error message')
    this.logger.debug('debug message')
  }

  getDefaultLogObect() {
    const jsonObj = { name: 'dankun', age: 20 };
    this.logger.error(jsonObj, { context: 'S-CORE' });
  }

  getDefaultLogWithContext() {
    this.logger.info('abct', { context: 'S-CORE', logLevel: 'info' });
  }

  info() {
    this.logger.info('测试INFO', { context: 'S-CORE' });
  }

  error() {
    this.logger.error('测试ERROR', { context: 'S-CORE' });
  }

  warn() {
    this.logger.warn('测试WARN', { context: 'S-CORE' });
  }

  debug() {
    this.logger.debug('测试DEBUG', { context: 'S-CORE' });
  }

  debugLevel() {
    this.logger.debug('测试DEBUG logLevel', { context: 'S-CORE', logLevel: 'debug' });
  }

  log() {
    this.logger.log('开始执行...');
    this.logger.log('执行成功', 'green');
  }

  getDebugMsg() {
    this.logger.debug('debug message');
  }

  getInfoMsg() {
    this.logger.info('info message');
  }
}

const demo = new LoggerDemo();
// demo.log();
demo.getDefaultLog();
// demo.getInfoMsg();

// Logger.info('S-CORE', 'dankun');
// demo.info();
// demo.error();
// demo.warn();
// demo.debug();
// demo.debugLevel();
// demo.getDefaultLog();
// demo.log();
// demo.getDefaultLogWithContext();
// demo.error();
// demo.warn();
// demo.debug();

// demo.report();

// const logger = new Logger();
// logger.error('dankun');

// enum LogLevelEnum {
//   'info', 'debug', 'warn', 'error', 'print', 'report'
// }
//
// console.log(LogLevelEnum[2]);
// const a = {
//   name: 'ex',
//   description: 'ex',
//   runtime: 'nodejs12',
//   codeUri: './code/index.js',
//   environmentVariables: {
//     aliyun_AccessKeyId: '123',
//     aliyun_AccessKeySecret: '321',
//   },
// };
// Logger.info('test', JSON.stringify(a, null, '  '));

// Logger.debug('xx', `logger密钥信息: ${JSON.stringify(input, null, 2)}`);

// const l = new Logger();
// l.debug(`logger密钥信息: ${JSON.stringify(input, null, 2)}`);

// Logger.log('some log message ')
// Logger.info('S-CORE', 'info message')
// Logger.warn('S-CORE', 'warn message')
// Logger.error('S-CORE', 'error message')
// Logger.debug('S-CORE', 'debug message')
// const logger = new Logger('S-CORE')
// logger.log('some log message ')
// logger.info('S-CORE', 'info message')
// logger.warn('S-CORE', 'warn message')
// logger.error('S-CORE', 'error message')
// logger.debug('S-CORE', 'debug message')
