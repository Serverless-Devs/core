import { request, spinner } from '../../src/common';
import { sleep } from '../../src/libs/utils';

class SpinnerDemo {
  async start() {
    const vm = spinner('开始执行');
    await sleep(1000);
    vm.text = 'hhh';
    vm.color = 'red';

    await Promise.resolve();
    await sleep(1000);
    vm.succeed('执行成功');
    // vm.stop();
    // spinner('请求失败').fail();
  }
  async test_request_hint() {
    await request('https://api.github.com/users/octocat', {
      data: {
        tag: 'fc',
        error: 'error',
      },
      hint: {
        loading: '数据请求中...',
        success: '数据请求成功',
        error: '数据请求失败',
      },
    });
  }
}

const demo = new SpinnerDemo();
// demo.test_request_hint();
demo.start();
