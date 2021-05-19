import { reportComponent } from '../../src/common';
import { HLogger, ILogger } from '../../src';

class ReportDemo {
  @HLogger('S-CORE') logger: ILogger;

  async component() {
    await reportComponent('website', {
      command: 'deploy',
      uid: '123435',
      remark: 'test',
    });
    this.logger.info('错误上报');
  }
}

const demo = new ReportDemo();

// demo.error();
demo.component();
