import ora, { Ora } from 'ora';
import { getCurrentEnvironment } from '@serverless-devs/utils';
import { noop } from 'lodash';
import chalk from 'chalk';

export { Ora } from 'ora';

export default function spinner(message: any): Ora {
  if (getCurrentEnvironment() === 'app_center') {
    const red = chalk.hex('#fd5750');
    console.log(message);
    return {
      succeed: (text?: string) => text && console.log(text),
      fail: (text?: string) => console.error(`${red('✖')} ${text || message}`),
      warn: (text?: string) => text && console.warn(text),
      info: (text?: string) => text && console.info(text),
      stop: noop,
      clear: noop,
    } as Ora;
  }
  const res = ora({ text: message, stream: process.stdout }).start();
  return res;
}
