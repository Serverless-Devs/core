import { isEmpty, get, assign, keys, split, filter, join, includes } from 'lodash';
import path from 'path';
import {
  IProjectConfig,
  IActionHook,
  IInputs,
  IGlobalArgs,
  IActionType,
  IServiceItem,
  IGlobalActionValue,
} from './interface';
import { makeUnderLine } from '../../libs';
import { logger } from '../../logger';
import chalk from 'chalk';

export function humanWarning(tips: string) {
  logger.log(
    `\n${chalk.hex('#000').bgYellow('WARNING:')}\n======================\n${makeUnderLine(tips)}\n`,
    'yellow',
  );
}

export function getProjectConfig(
  configs: any,
  serviceName: string,
  globalArgs: IGlobalArgs,
): IProjectConfig {
  const services = get(configs, 'services', {});
  const data = get(services, serviceName, {});
  const provider = data.provider || configs.provider;
  const access = data.access || configs.access;
  return assign({}, data, {
    access: globalArgs?.access || access,
    provider,
    appName: configs.name,
    serviceName,
  });
}

export function getCurrentPath(p: string = './', spath: string) {
  if (path.isAbsolute(p)) return p;
  const dir = path.dirname(spath);
  return p ? path.join(dir, p) : dir;
}

export function getActions(configs: IProjectConfig, { method, spath }): IActionHook[] {
  function validate(hook: IActionHook): IActionType {
    if ('run' in hook && !('component' in hook) && !('plugin' in hook)) return 'run';
    if ('component' in hook && !('run' in hook) && !('plugin' in hook)) return 'component';
    if ('plugin' in hook && !('run' in hook) && !('component' in hook)) return 'plugin';
    throw new Error(
      JSON.stringify({
        message: 'actions configuration is incorrect.',
        tips: 'Please check the configuration of actions.',
      }),
    );
  }
  const { actions } = configs;
  if (isEmpty(actions)) return;
  const hooks: IActionHook[] = [];
  const keyList = keys(actions);
  for (const actionKey of keyList) {
    const hookList = actions[actionKey];
    if(isEmpty(hookList)) continue;
    const [start, end] = split(actionKey, '-');
    const action = start as IGlobalActionValue;
    if (end === method) {
      for (const hookDetail of hookList) {
        const type = validate(hookDetail);
        if (type === 'run') {
          const obj = {
            type,
            value: hookDetail[type],
            path: getCurrentPath(hookDetail.path, spath),
            pre: start === 'pre' ? true : false,
            action,
          };
          hooks.push(obj);
        }

        if (type === 'component') {
          const obj = {
            type,
            value: hookDetail[type],
            pre: start === 'pre' ? true : false,
            action,
          };
          hooks.push(obj);
        }

        if (type === 'plugin') {
          const obj = {
            type,
            value: hookDetail[type],
            pre: start === 'pre' ? true : false,
            action,
            args: hookDetail.args,
          };
          hooks.push(obj);
        }
      }
    }
  }
  return hooks;
}

export function getInputs(
  configs: IProjectConfig,
  { method, args, spath, serverName, output, serviceList }: any,
): IInputs {
  const argsObj = filter(args, (o) => !includes([serverName, method], o));
  const inputs = {
    props: configs.props,
    credentials: configs.credentials,
    appName: configs.appName,
    project: {
      component: configs.component,
      access: configs.access,
      projectName: configs.serviceName,
      provider: configs.provider,
    },
    command: method,
    args: join(argsObj, ' '),
    argsObj,
    path: {
      configPath: spath,
    },
    services: serviceList,
    output,
  };
  return inputs;
}

export function throwError(params: { error: any; prefix?: string; serviceName?: string }) {
  const { error, serviceName, prefix } = params;

  let jsonMsg;
  try {
    jsonMsg = JSON.parse(error.message);
  } catch (error) {}

  if (jsonMsg && jsonMsg.tips) {
    throw new Error(
      JSON.stringify({
        code: 101,
        message: jsonMsg.message,
        tips: jsonMsg.tips,
        prefix: prefix || `Project ${serviceName} failed to execute:`,
      }),
    );
  } else {
    throw new Error(
      JSON.stringify({
        code: 101,
        message: error.message,
        stack: error.stack,
        prefix: prefix || `Project ${serviceName} failed to execute:`,
      }),
    );
  }
}

export function transformServiceList({ response, inputs, serverName }): IServiceItem {
  return {
    serviceName: serverName,
    component: get(inputs, 'project.component'),
    access: get(inputs, 'project.access'),
    credentials: get(inputs, 'credentials'),
    props: get(inputs, 'props'),
    output: response,
  };
}
