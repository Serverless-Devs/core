import { reportComponent } from '../../lib';

class ReportDemo {
  async component() {
    await reportComponent('website', {
      command: 'deploy',
      uid: '123435',
      remark: 'test',
    });
  }
}

const demo = new ReportDemo();

// demo.error();
demo.component();
