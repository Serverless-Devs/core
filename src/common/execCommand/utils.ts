import { isEmpty, get, assign, keys, split, filter, join, includes } from 'lodash';
import path from 'path';
import { IProjectConfig, IActionHook, IInputs, IGlobalArgs } from './interface';
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

export function getCurrentPath(p: string, spath: string) {
  if (path.isAbsolute(p)) return p;
  const dir = path.dirname(spath);
  return p ? path.join(dir, p) : dir;
}

export function getActions(configs: IProjectConfig, { method, spath }): IActionHook[] {
  const { actions } = configs;
  if (isEmpty(actions)) return;
  const hooks: IActionHook[] = [];
  const keyList = keys(actions);
  for (const actionKey of keyList) {
    const hookList = actions[actionKey];
    const [start, end] = split(actionKey, '-');
    if (end === method) {
      for (const hookDetail of hookList) {
        const obj = {
          run: hookDetail.run,
          path: getCurrentPath(hookDetail.path, spath),
          pre: start === 'pre' ? true : false,
        };
        hooks.push(obj);
      }
    } else if (actionKey === method) {
      for (const hookDetail of hookList) {
        const obj = {
          run: hookDetail.run,
          path: getCurrentPath(hookDetail.path, spath),
          pre: false,
        };
        hooks.push(obj);
      }
    }
  }
  return hooks;
}

export function getInputs(configs: IProjectConfig, { method, args, spath, serverName }): IInputs {
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
  };
  return inputs;
}
