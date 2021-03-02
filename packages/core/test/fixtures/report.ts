import { report } from '../../src/common';
import { HLogger, ILogger } from '../../src';
const fetch = require('node-fetch');

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
  async get() {
    // const params = new URLSearchParams();
    // params.append('a', '1');
    // const response = await fetch('https://httpbin.org/post', {
    //   method: 'POST',
    //   body: params,
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // });

    const response = await fetch('https://github.com/');
    const contentType = response.headers.get('content-type');
    console.log(contentType);
    // const data = await response.json();
    // console.log(data);
  }
}

const demo = new ReportDemo();

demo.error();
// demo.get();
// demo.component();
