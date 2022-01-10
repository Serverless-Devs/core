import chalk from 'chalk';
import report from '../common/report';

const bgRed = chalk.hex('#000').bgHex('#fd5750');

interface IConfigs {
  errorMessage: string;
  tips?: string;
}

interface IReport {
  error: Error;
}
export default class HumanError {
  private errorMessage: string;
  constructor(configs: IConfigs) {
    const { errorMessage, tips } = configs;
    this.errorMessage = errorMessage;
    console.log(`\n${bgRed('ERROR:')}`);
    console.log(`TypeError: ${errorMessage}\n`);
    tips && console.log(`${chalk.gray(tips)}\n`);
  }

  async report(configs: IReport) {
    const { error } = configs;
    await report({
      type: 'jsError',
      content: `${this.errorMessage}||${error.stack}`,
    });
  }
}
