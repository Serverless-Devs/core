import { IComponentConfig, IInputs, IProjectConfig } from '../interface';
import { getRootHome, getSetConfig, getYamlContent } from '../../../libs';
import path from 'path';
import { getCredential } from '../../credential';
import { getActions, getInputs } from '../utils';
import Hook from './hook';
import { loadComponent } from '../../load';
import { DEFAULT_REGIRSTRY, IRegistry } from '../../constant';
import chalk from 'chalk';
import { assign, toString } from 'lodash';

class ComponentExec {
  protected hook: Hook;
  projectConfig: IProjectConfig;

  constructor(private config: IComponentConfig) {
    this.projectConfig = config.projectConfig;
  }
  private async handleCredentials() {
    const { projectConfig } = this.config;
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    // 密钥存在 才去获取密钥信息
    if (data[projectConfig.access]) {
      const credentials = await getCredential(projectConfig.access);
      this.projectConfig = assign({}, projectConfig, { credentials });
    }
  }
  async init() {
    const { method, spath, globalArgs } = this.config;
    await this.handleCredentials();
    const actions = getActions(this.projectConfig, {
      method,
      spath,
    });
    const params = globalArgs?.skipActions ? [] : actions;
    this.hook = new Hook(params);
    this.hook.executePreHook();
    const outPutData = await this.executeCommand();
    this.hook.executeAfterHook();
    return outPutData;
  }
  private async executeCommand() {
    const { method, spath, args, serverName } = this.config;

    const inputs = getInputs(this.projectConfig, {
      method,
      args,
      spath,
      serverName,
    });

    this.debugForJest(inputs, { method });

    const registry: IRegistry = await getSetConfig('registry', DEFAULT_REGIRSTRY);
    const instance = await loadComponent(this.projectConfig.component, registry);
    const res = await this.invokeMethod(instance, inputs);
    return res && JSON.parse(JSON.stringify(res));
  }
  private debugForJest(inputs, { method }) {
    if (process.env['serverless-devs-debug'] === 'true') {
      const newInputs = assign({}, inputs);
      const credentials = newInputs.credentials;
      if (credentials) {
        for (const key in credentials) {
          const val = toString(credentials[key]);
          const len = val.length;
          newInputs.credentials[key] =
            len > 6 ? val.slice(0, 3) + '*'.repeat(len - 6) + val.slice(len - 3) : val;
        }
      }
      console.log(
        `project:${this.projectConfig.serviceName} component:${
          this.projectConfig.component
        } method: ${method} inputs: ${JSON.stringify(newInputs, null, 2)} `,
      );
    }
  }
  async invokeMethod(instance: any, inputs: IInputs) {
    const { serverName, method } = this.config;
    // 服务级操作
    if (serverName) {
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
          message: `The [${method}] command was not found.`,
          tips: `Please check the component ${
            this.projectConfig.component
          } has the ${method} method. Serverless Devs documents：${chalk.underline(
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
          message: `The [${method}] command was not found.`,
          tips: `Please check the component ${
            this.projectConfig.component
          } has the ${method} method. Serverless Devs documents：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
          )}`,
        }),
      );
    }
  }
}

export default ComponentExec;
