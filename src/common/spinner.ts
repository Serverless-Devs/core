import ora, { Ora } from 'ora';
import { getCurrentEnvironment } from '@serverless-devs/utils';
import { noop } from 'lodash';

export { Ora } from 'ora';

export default function spinner(message: any): Ora {
  if (getCurrentEnvironment() === 'app_center') {
    console.log(message);
    return {
      succeed: (text) => text && console.log(text),
      fail: (text) => text && console.log(text),
      warn: (text) => text && console.log(text),
      info: (text) => text && console.log(text),
      stop: noop,
      clear: noop,
    } as Ora;
  }
  const res = ora({ text: message, stream: process.stdout }).start();
  return res;
}
