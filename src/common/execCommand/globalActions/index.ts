import fs from 'fs-extra';
import os from 'os';
import execa from 'execa';
import path from 'path';
import { getActions, getCurrentPath } from '../utils';
import {
  IActionHook,
  IGlobalAction,
  IGlobalActionValue,
  IGlobalInputs,
  IGlobalArgs,
  IProjectConfig,
} from '../interface';
import { logger } from '../../../logger';
import { filter, isEmpty, get, join } from 'lodash';
import { loadComponent } from '../../load';
import { throwError } from '../utils';
import { HumanWarning } from '../../error';
import { ALIYUN_CLI } from '../../constant';
import { getCredential, getCredentialFromEnv } from '../../credential';
import { getRootHome, getYamlContent } from '../../../libs';
import { execDaemon } from '../../../execDaemon';
import { getCurrentEnvironment, isCiCdEnvironment } from '@serverless-devs/utils';
import rimraf from 'rimraf';
interface IConfig {
  realVariables: Record<string, any>;
  method: string;
  spath: string;
  globalArgs: IGlobalArgs;
}

class GlobalActions {
  private tracePath: string;
  private actions: IActionHook[];
  private record: Record<string, any> = {};
  constructor(private config: IConfig) {
    const { realVariables, method, spath } = config;
    this.actions = getActions(realVariables as IProjectConfig, {
      method,
      spath,
    });
  }
  addInputs(data: Record<string, any>) {
    this.record = { ...this.record, ...data };
  }
  private async getInputs() {
    const { realVariables, globalArgs, spath, method } = this.config;
    const access = get(globalArgs, 'access') || get(realVariables, 'access');
    const credentials = await this.doCredential(access);
    const index = process.argv.indexOf(method);
    const argsObj = process.argv.slice(index + 1);
    return {
      credentials,
      access,
      appName: get(realVariables, 'name'),
      path: {
        configPath: spath,
      },
      command: method,
      args: join(argsObj, ' '),
      argsObj,
    } as IGlobalInputs;
  }
  private async doCredential(access: string) {
    if (access === ALIYUN_CLI) {
      return await getCredential(access);
    }
    const accessFromEnv = await getCredentialFromEnv(access);
    if (accessFromEnv) {
      return accessFromEnv;
    }
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    // 密钥存在 才去获取密钥信息
    if (get(data, access)) {
      return await getCredential(access);
    }
  }
  async run(type: IGlobalActionValue) {
    if (type === IGlobalAction.COMPLETE) {
      await this.tracker();
      rimraf.sync(this.tracePath);
    }
    const hooks = filter(this.actions, (item) => item.action === type);
    if (isEmpty(hooks)) return;
    logger.info(`Start the global ${type}-action`);
    for (const hook of hooks) {
      logger.info(`Global action: ${hook.value}`);
      await this.commandExecute(hook, type);
    }
    logger.info(`End the global ${type}-action`);
  }

  private async commandExecute(configs: IActionHook, type: IGlobalActionValue) {
    if (configs.type === 'run') {
      const execPath = configs.path;
      if (fs.existsSync(execPath) && fs.lstatSync(execPath).isDirectory()) {
        try {
          execa.sync(configs.value, {
            cwd: execPath,
            stdio: 'inherit',
            shell: true,
          });
        } catch (error) {
          // 如果是pre的时候报错，需要提示用户
          if (type !== IGlobalAction.PRE) return;
          if (os.platform() === 'win32') {
            logger.info('Command run execution environment：CMD');
            new HumanWarning({
              warningMessage:
                'Please check whether the actions section of yaml can be executed in the current environment.',
            });
          }
          throwError({
            error,
            prefix: 'Global pre-action failed to execute:',
          });
        }
      }
    }

    if (configs.type === 'plugin') {
      const { spath } = this.config;
      const newValue = getCurrentPath(configs.value, spath);
      const instance = await loadComponent(fs.existsSync(newValue) ? newValue : configs.value);
      const inputs: IGlobalInputs = await this.getInputs();
      await instance({ ...inputs, ...this.record }, configs.args);
    }
  }
  private async tracker() {
    const traceId = process.env['serverless_devs_trace_id'];
    if (isEmpty(traceId)) return;
    if (isCiCdEnvironment()) return;
    const inputs: IGlobalInputs = await this.getInputs();
    const newInputs = { ...inputs, ...this.record };
    const yamlContent = await getYamlContent(get(newInputs, 'path.configPath'));
    if (isEmpty(yamlContent)) return;
    this.tracePath = path.join(getRootHome(), 'config', `${traceId}.json`);
    if(!fs.existsSync(this.tracePath)) return;
    const data = fs.readJSONSync(this.tracePath);
    if (isEmpty(data)) return;

    execDaemon('tracker.js', {
      inputs: JSON.stringify({
        platform: getCurrentEnvironment(),
        resource: data,
        orgName: get(yamlContent, 'orgName'),
        name: get(yamlContent, 'name'),
        env: get(yamlContent, 'env', 'default'),
        status: get(newInputs, 'status'),
        time: new Date().getTime(),
      }),
    });
  }
}

export default GlobalActions;
