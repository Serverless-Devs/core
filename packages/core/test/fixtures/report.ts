import { report } from '../../src/common';
import { HLogger, ILogger } from '../../src';

class ReportDemo {
  @HLogger('S-CORE') logger: ILogger;

  async error() {
    await report('错误上报', {
      type: 'error',
      context: 'fc',
    });
    this.logger.error('错误上报');
  }
  async component() {
    await report('组件数据上报', {
      type: 'component',
      context: 'fc',
      params: {
        action: 'deploy',
        account: '123435',
      },
    });
    this.logger.info('成功上报');
  }
}

const demo = new ReportDemo();

// demo.error();
demo.component();
