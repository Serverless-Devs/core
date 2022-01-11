import chalk from 'chalk';

interface IConfigs {
  warningMessage: string;
  tips?: string;
}

class HumanWarning {
  constructor(configs: IConfigs) {
    const { warningMessage, tips } = configs;
    console.log(`\n${chalk.hex('#000').bgYellow('WARNING:')}`);
    console.log(`${warningMessage}\n`);
    tips && console.log(`${chalk.gray(tips)}\n`);
  }
}

export default HumanWarning;
