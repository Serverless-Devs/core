import { HLogger } from '../../src';
import { Logger } from '../../src/logger';

const input = {
  Credentials: {
    Alias: 'default',
    AccountID: '16940247251212952210',
    AccessKeyID: 'LTAI4FztxxxgZMtMjtrY',
    AccessKeySecret: 'LTAI4FztxxxgZMtMjtrY',
  },
  credentials: {
    Alias: 'default',
    AccountID: '169402472sds5952210',
    AccessKeyID: 'LTAI4FztxxxgZMtMjtrY',
    AccessKeySecret: 'LTAI4FztxxxgZMtMjtrY',
  },
  appName: 'appName',
  Path: {
    ConfigPath: '/Users/shihuali/workspace/jamstack-api/example/s.yaml',
  },
};

class LoggerDemo {
  @HLogger('S-CORE') logger;

  async getDefaultLog() {
    console.log(process.argv);
    this.logger.debug(JSON.stringify(input, null, 2), 'xxx');
    this.logger.info('abc');
    this.logger.warn('abc');
    this.logger.error('abc');
    this.logger.fatal('abc');
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

Logger.debug('xx', `logger密钥信息: ${JSON.stringify(input, null, 2)}`);

const l = new Logger();
l.debug(`logger密钥信息: ${JSON.stringify(input, null, 2)}`);
