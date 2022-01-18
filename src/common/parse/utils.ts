import fs from 'fs-extra';
import { endsWith, isEmpty, get, assign, keys, split } from 'lodash';
import path from 'path';
import chalk from 'chalk';
import { IProjectConfig, IActionHook, IInputs, IGlobalArgs } from './interface';
import yaml from 'js-yaml';
import { getYamlContent, getGlobalArgs } from '../../libs';

async function validateTemplateFile(spath: string): Promise<boolean> {
  if (isEmpty(spath)) return false;
  try {
    if (endsWith('json')) {
      const data = fs.readJSONSync(spath);
      return data.hasOwnProperty('edition');
    }
    if (endsWith(spath, 'yaml') || endsWith(spath, 'yml')) {
      const data = await getYamlContent(spath);
      if (isEmpty(data)) {
        const filename = path.basename(spath);
        throw new Error(
          JSON.stringify({
            message: `${filename} format is incorrect`,
            tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
              'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
            )}`,
          }),
        );
      }
      return data.hasOwnProperty('edition');
    }
  } catch (error) {
    return false;
  }
}

export async function getTemplatePath(spath?: string) {
  if (await validateTemplateFile(spath)) return spath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (await validateTemplateFile(sYamlPath)) return sYamlPath;
  const sJsonPath = path.join(cwd, 's.json');
  if (await validateTemplateFile(sJsonPath)) return sJsonPath;
}

export async function setupEnv(templateFile: string) {
  const spath = path.dirname(templateFile);
  require('dotenv').config({ path: path.join(spath, '.env') });
  const data = await getYamlContent(templateFile);
  const { services } = data;
  for (const key in services) {
    const element = services[key];
    let codeUri = get(element, 'props.function.codeUri');
    if (codeUri) {
      codeUri = path.isAbsolute(codeUri) ? codeUri : path.join(spath, codeUri);
      require('dotenv').config({ path: path.join(codeUri, '.env') });
    }
  }
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
    access: globalArgs.access || access,
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

export function getInputs(configs: IProjectConfig, { method, args, spath }): IInputs {
  const globalArgs = getGlobalArgs(args);
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
    args: globalArgs.args,
    argsObj: globalArgs.argsObj,
    path: {
      configPath: spath,
    },
  };
  return inputs;
}

export function getFileObj(filePath: string) {
  let fileObj = {};
  try {
    const extname = path.extname(filePath);
    if (extname.indexOf('.yaml') !== -1 || extname.indexOf('.yml') !== -1) {
      fileObj = yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
    if (extname.indexOf('.json') !== -1) {
      fileObj = fs.readJSONSync(filePath);
    }
  } catch (error) {}
  return fileObj;
}
