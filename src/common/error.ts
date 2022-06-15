import { logger } from '../logger';
import chalk from 'chalk';
interface IConfigs {
  warningMessage: string;
  tips?: string;
}

export class HumanWarning {
  constructor(configs: IConfigs) {
    const { warningMessage, tips } = configs;
    logger.log(`\n${chalk.hex('#000').bgYellow('WARNING:')}`);
    logger.log(`${warningMessage}\n`);
    tips && logger.log(`${chalk.gray(tips)}\n`);
  }
}

export class CatchableError extends Error {
  constructor(tips, message?: string) {
    super(
      JSON.stringify({
        message,
        tips,
      }),
    );
    this.name = 'CatchableError';
  }
}
