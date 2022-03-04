import fs from 'fs';
import { logger } from '../../../logger';
import { IActionHook } from '../interface';
import execa from 'execa';

class Hook {
  private preHooks: IActionHook[] = [];
  private afterHooks: IActionHook[] = [];

  constructor(hooks: IActionHook[] = []) {
    for (const hook of hooks) {
      hook.pre ? this.preHooks.push(hook) : this.afterHooks.push(hook);
    }
  }

  async executePreHook() {
    if (this.preHooks.length > 0) {
      logger.info('Start the pre-action');
      for (const hook of this.preHooks) {
        logger.info(`Action: ${hook.run || hook.plugin}`);
        await this.commandExecute(hook);
      }
      logger.info('End the pre-action');
    }
  }

  async executeAfterHook() {
    if (this.afterHooks.length > 0) {
      logger.info('Start the after-action');
      for (const hook of this.afterHooks) {
        logger.info(`Action: ${hook.run || hook.plugin}`);
        await this.commandExecute(hook);
      }
      logger.info('End the after-action');
    }
  }

  private async commandExecute(configs: IActionHook) {
    const execPath = configs.path;
    if (fs.existsSync(execPath) && fs.lstatSync(execPath).isDirectory()) {
      try {
        execa.sync(configs.run, { cwd: execPath, stdio: 'inherit', shell: true });
      } catch (error) {
        throw new Error(`Action: [${configs.run}] run error.`);
      }
    }
  }
}

export default Hook;
