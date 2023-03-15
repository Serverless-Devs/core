import {  spinner } from '../../src/common';
import { sleep } from '../../src/libs/utils';

class SpinnerDemo {
  async start() {
    const vm = spinner('开始执行');
    await sleep(1000);
    vm.text = 'hhh';
    vm.color = 'red';
    await sleep(1000);
    vm.succeed('执行成功');
    // vm.stop();
    // spinner('请求失败').fail();
  }
}

const demo = new SpinnerDemo();
demo.start();
