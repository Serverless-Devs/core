import { IComponentConfig, IProjectConfig, IInputs } from '../interface';
import { getRootHome, getSetConfig } from '../../../libs/common';
import { logger } from '../../../libs/utils';
import path from 'path';
import getYamlContent from '../../getYamlContent';
import { getCredential } from '../../credential';
import { getActions, getInputs } from '../utils';
import Hook from './hook';
import { loadComponent } from '../../load';
import { DEFAULT_REGIRSTRY, IRegistry } from '../../constant';
import { HumanError, HandleError, HumanWarning } from '../../../error';
import chalk from 'chalk';
import { keys } from 'lodash';

class ComponentExec {
  private projectConfig: IProjectConfig;
  private method: string;
  private args: string;
  private spath: string;
  private serverName: string;

  protected hook: Hook;

  constructor(config: IComponentConfig) {
    this.projectConfig = config.projectConfig;
    this.method = config.method;
    this.args = config.args;
    this.spath = config.spath;
    this.serverName = config.serverName;
  }
  private async handleCredentials() {
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    if (data[this.projectConfig.access]) {
      this.projectConfig.credentials = await getCredential();
    }
  }
  async init() {
    await this.handleCredentials();
    const actions = getActions(this.projectConfig, {
      method: this.method,
      spath: this.spath,
    });
    this.hook = new Hook(actions);
    this.hook.executePreHook();
    const outPutData = await this.executeCommand();
    this.hook.executeAfterHook();

    keys(outPutData).length === 0
      ? logger.log(`End of method: ${this.method}`, 'green')
      : logger.output(outPutData);
  }
  private async executeCommand() {
    const inputs = getInputs(this.projectConfig, {
      method: this.method,
      args: this.args,
      spath: this.spath,
    });
    const registry: IRegistry = await getSetConfig('registry', DEFAULT_REGIRSTRY);
    const instance = await loadComponent(this.projectConfig.component, registry);
    const res = await this.invokeMethod(instance, this.method, inputs);
    return JSON.parse(JSON.stringify({ [this.projectConfig.serviceName]: res }));
  }
  async invokeMethod(instance: any, method: string, inputs: IInputs) {
    // 服务级操作
    if (this.serverName) {
      if (instance[method]) {
        // 方法存在，执行报错，退出码101
        try {
          const result = await instance[method](inputs);
          return result;
        } catch (error) {
          await HandleError({
            error,
            prefix: `Project ${this.projectConfig.serviceName} failed to execute:`,
          });
          process.exit(101);
        }
      }
      // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
      new HumanError({
        errorMessage: `The [${this.method}] command was not found.`,
        tips: `Please check the component ${this.projectConfig.component} has the ${
          this.method
        } method. Serverless Devs documents：${chalk.underline(
          'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
        )}`,
      });
      process.exit(100);
    }
    // 应用级操作
    if (instance[method]) {
      // 方法存在，执行报错，退出码101
      try {
        const result = await instance[method](inputs);
        return result;
      } catch (error) {
        await HandleError({
          error,
          prefix: `Project ${this.projectConfig.serviceName} failed to execute:`,
        });
        process.exit(101);
      }
    } else {
      // 方法不存在，进行警告，但是并不会报错，最终的exit code为0；
      new HumanWarning({
        warningMessage: `The [${this.method}] command was not found.`,
        tips: `Please check the component ${this.projectConfig.component} has the ${
          this.method
        } method, Serverless Devs documents：${chalk.underline(
          'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
        )}`,
      });
    }
  }
}

export default ComponentExec;
