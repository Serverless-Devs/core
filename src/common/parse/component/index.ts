import { IComponentConfig, IProjectConfig, IInputs } from '../interface';
import { getRootHome, getSetConfig, getYamlContent } from '../../../libs';
import path from 'path';
import { getCredential } from '../../credential';
import { getActions, getInputs } from '../utils';
import Hook from './hook';
import { loadComponent } from '../../load';
import { DEFAULT_REGIRSTRY, IRegistry } from '../../constant';
import chalk from 'chalk';
import { IGlobalParams } from '../../../interface';

class ComponentExec {
  private projectConfig: IProjectConfig;
  private method: string;
  private args: string;
  private spath: string;
  private serverName: string;
  private globalParams: IGlobalParams;

  protected hook: Hook;

  constructor(config: IComponentConfig) {
    this.projectConfig = config.projectConfig;
    this.method = config.method;
    this.args = config.args;
    this.spath = config.spath;
    this.serverName = config.serverName;
    this.globalParams = config.globalParams;
  }
  private async handleCredentials() {
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    // 密钥存在 才去获取密钥信息
    if (data[this.projectConfig.access]) {
      this.projectConfig.credentials = await getCredential(this.projectConfig.access);
    }
  }
  async init() {
    await this.handleCredentials();
    const actions = getActions(this.projectConfig, {
      method: this.method,
      spath: this.spath,
    });
    const params = this.globalParams.skipActions ? [] : actions;
    this.hook = new Hook(params);
    this.hook.executePreHook();
    const outPutData = await this.executeCommand();
    this.hook.executeAfterHook();
    return outPutData;
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
    return JSON.parse(JSON.stringify(res));
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
          throw new Error(
            JSON.stringify({
              code: 101,
              message: error.message,
              stack: error.stack,
              prefix: `Project ${this.projectConfig.serviceName} failed to execute:`,
            }),
          );
        }
      }
      // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
      throw new Error(
        JSON.stringify({
          code: 100,
          message: `The [${this.method}] command was not found.`,
          tips: `Please check the component ${this.projectConfig.component} has the ${
            this.method
          } method. Serverless Devs documents：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
          )}`,
        }),
      );
    }
    // 应用级操作
    if (instance[method]) {
      // 方法存在，执行报错，退出码101
      try {
        const result = await instance[method](inputs);
        return result;
      } catch (error) {
        throw new Error(
          JSON.stringify({
            code: 101,
            message: error.message,
            stack: error.stack,
            prefix: `Project ${this.projectConfig.serviceName} failed to execute:`,
          }),
        );
      }
    } else {
      // 方法不存在，进行警告，但是并不会报错，最终的exit code为0；
      throw new Error(
        JSON.stringify({
          code: 0,
          message: `The [${this.method}] command was not found.`,
          tips: `Please check the component ${this.projectConfig.component} has the ${
            this.method
          } method. Serverless Devs documents：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
          )}`,
        }),
      );
    }
  }
}

export default ComponentExec;