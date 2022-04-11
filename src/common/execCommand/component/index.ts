import { IComponentConfig, IInputs, IProjectConfig } from '../interface';
import { getRootHome, getSetConfig, getYamlContent } from '../../../libs';
import path from 'path';
import { getCredential, getCredentialFromEnv } from '../../credential';
import { getActions, getInputs, humanWarning, throwError } from '../utils';
import Hook from './hook';
import { loadComponent } from '../../load';
import { DEFAULT_REGIRSTRY, IRegistry } from '../../constant';
import chalk from 'chalk';
import { assign, toString } from 'lodash';
import { logger } from '../../../logger';
import report from '../../report';
import { get } from 'lodash';
import { ALIYUN_CLI } from '../../constant';

class ComponentExec {
  protected hook: Hook;
  private projectConfig: IProjectConfig;

  constructor(private config: IComponentConfig) {
    this.projectConfig = config.projectConfig;
  }
  private async handleCredentials() {
    const { projectConfig } = this.config;
    if (projectConfig.access === ALIYUN_CLI) {
      return (this.projectConfig = assign({}, projectConfig, {
        credentials: await getCredential(projectConfig.access),
      }));
    }
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    // 密钥存在 才去获取密钥信息
    if (get(data, projectConfig.access)) {
      const credentials = await getCredential(projectConfig.access);
      this.projectConfig = assign({}, projectConfig, { credentials });
    }
    const accessFromEnv = await getCredentialFromEnv(projectConfig.access);
    if (accessFromEnv) {
      this.projectConfig = assign({}, projectConfig, { credentials: accessFromEnv });
    }
  }
  async init() {
    const { method, spath, args, serverName } = this.config;
    await this.handleCredentials();
    const AccountID = get(this.projectConfig, 'credentials.AccountID');
    report({
      type: 'action',
      // TODO: 后续 可以最后一个 AccountID 删除以及sls加工数据格式。为了不影响现在的数据上报，暂时保持以前的数据格式
      content: `${this.projectConfig.component}||${AccountID}||${AccountID}`,
    });

    const inputs = getInputs(this.projectConfig, {
      method,
      args,
      spath,
      serverName,
    });
    this.hook = new Hook(inputs);

    const preHookOutData = await this.hook.init(await this.getNewActions({})).executePreHook();
    const output = await this.executeCommand(preHookOutData);
    await this.hook.init(await this.getNewActions({ output })).executeAfterHook({ output });
    return output;
  }
  private async getNewActions({ output }: { output?: any }) {
    const { method, spath, serverName, globalArgs } = this.config;
    const that = {
      name: serverName,
      access: this.projectConfig.access,
      actions: this.projectConfig.actions,
      component: this.projectConfig.component,
      props: this.projectConfig.props,
      output,
    };
    const tempData = { this: that };
    const { realVariables } = await this.config.parse.init(tempData);
    this.projectConfig.actions = get(realVariables, ['services', serverName, 'actions']);
    const actions = getActions(this.projectConfig, {
      method,
      spath,
    });
    return globalArgs?.skipActions ? [] : actions;
  }
  private async executeCommand(payload: { type: 'component' | 'plugin'; data: any }) {
    const { method, spath, args, serverName } = this.config;

    const inputs =
      get(payload, 'type') === 'plugin'
        ? get(payload, 'data')
        : getInputs(this.projectConfig, {
            method,
            args,
            spath,
            serverName,
            output: get(payload, 'data'),
          });

    this.debugForJest(inputs, { method });

    const registry: IRegistry = await getSetConfig('registry', DEFAULT_REGIRSTRY);
    const instance = await loadComponent(this.projectConfig.component, registry);
    const res = await this.invokeMethod(instance, inputs);
    return typeof res === 'object' ? JSON.parse(JSON.stringify(res)) : res;
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
    const { method, specifyService } = this.config;
    // 服务级操作
    if (specifyService) {
      if (instance[method]) {
        // 方法存在，执行报错，退出码101
        try {
          const result = await instance[method](inputs);
          return result;
        } catch (error) {
          throwError({
            error,
            serviceName: this.projectConfig.serviceName,
          });
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
        throwError({
          error,
          serviceName: this.projectConfig.serviceName,
        });
      }
    } else {
      // 方法不存在，进行警告，但是并不会报错，最终的exit code为0；
      const tips = `Please check the component ${this.projectConfig.component} has the ${method} method. Serverless Devs documents：https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command`;
      humanWarning(tips);
      logger.log(chalk.grey(`The [${method}] command was not found.\n`));
    }
  }
}

export default ComponentExec;
