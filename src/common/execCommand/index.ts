import Parse from './parse';
import { isEmpty, get, isNil, keys, isPlainObject, includes, filter } from 'lodash';
import { logger, makeLogFile } from '../../logger';
import Analysis from './analysis';
import { getProjectConfig, transformServiceList } from './utils';
import { getTemplatePath, transforYamlPath } from './getTemplatePath';
import ComponentExec from './component';
import { IGlobalArgs, STATUS } from './interface';
import reportTracker from '../reportTracker';
import yaml from 'js-yaml';

interface IConfigs {
  syaml?: string;
  serverName?: string;
  method: string;
  args?: string[];
  env?: object;
  globalArgs?: IGlobalArgs;
}

class ExecCommand {
  private configs: IConfigs;
  private parse: Parse;
  constructor(configs: IConfigs) {
    this.configs = configs;
    const { env } = configs;
    if (isPlainObject(env)) {
      for (const key in env) {
        process.env[key] = env[key];
      }
    }
    // 写入日志的时候，先确保创建了日志文件
    makeLogFile();
  }
  async init() {
    const { syaml, serverName, globalArgs = {} } = this.configs;
    const originSpath = await getTemplatePath(syaml);
    const spath = await transforYamlPath(originSpath);
    this.parse = new Parse(spath);
    let parsedObj = await this.parse.init();
    // 兼容vars下的魔法变量，需再次解析
    parsedObj = await this.parse.init(parsedObj.realVariables);
    await this.warnEnvironmentVariables(parsedObj.realVariables);
    const analysis = new Analysis(parsedObj.realVariables, parsedObj.dependenciesMap);
    const executeOrderList = analysis.getProjectOrder();
    reportTracker({ trackerType: 'command', syaml: spath, access: globalArgs.access });
    // 只有一个服务，或者指定服务操作
    if (executeOrderList.length === 1 || serverName) {
      const tempCustomerCommandName = executeOrderList[0];
      return await this.serviceOnlyOne({
        realVariables: parsedObj.realVariables,
        serverName: serverName || tempCustomerCommandName,
        spath: originSpath,
        specifyService: Boolean(serverName),
      });
    }
    return await this.serviceWithMany({ executeOrderList, spath: originSpath });
  }

  private async serviceOnlyOne({ realVariables, serverName, spath, specifyService }) {
    const { method, args, globalArgs } = this.configs;
    const projectConfig = getProjectConfig(realVariables, serverName, globalArgs);
    const { response } = await new ComponentExec({
      projectConfig,
      method,
      args,
      spath,
      serverName,
      globalArgs,
      specifyService,
      parse: this.parse, // 如果actions模块包含魔法变量，需要再次解析
    }).init();
    const result = { [serverName]: response };
    if (process.env['default_serverless_devs_auto_log'] === 'false') {
      logger.log(`End of method: ${method}`, 'green');
      return result;
    }
    keys(response).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : this.doOutput(result);
    return result;
  }

  private doOutput(result) {
    const { globalArgs } = this.configs;
    if (globalArgs?.output === 'json') {
      return logger.log(JSON.stringify(result, null, 2));
    }
    if (globalArgs?.output === 'raw') {
      return logger.log(JSON.stringify(result));
    }
    if (globalArgs?.output === 'yaml') {
      return logger.log(yaml.dump(result));
    }
    logger.output(result);
  }

  private async serviceWithMany({ executeOrderList, spath }) {
    const { method, args, globalArgs } = this.configs;
    logger.info(
      `It is detected that your project has the following projects < ${executeOrderList.join(
        ',',
      )} > to be execute`,
    );
    // 存储services
    const serviceList = [];
    const result = {};
    // 临时存储output, 对yaml文件再次解析
    const tempData = { services: {} };
    for (const serverName of executeOrderList) {
      logger.info(`Start executing project ${serverName}`);
      const parsedObj = await this.parse.clearGlobalKey('this').init(tempData);
      const projectConfig = getProjectConfig(parsedObj.realVariables, serverName, globalArgs);
      const { response, inputs, status } = await new ComponentExec({
        projectConfig,
        method,
        args,
        spath,
        serverName,
        globalArgs,
        parse: this.parse,
        serviceList,
      }).init();
      if (status === STATUS.SUCCESS) {
        const newObj = transformServiceList({ response, inputs, serverName });
        serviceList.push({ ...newObj, status });
        tempData.services[serverName] = { output: response };
        result[serverName] = response;
        logger.info(`Project ${serverName} successfully to execute \n\t`);
      }
      if (status === STATUS.ERROR) {
        throw response;
      }
    }
    if (process.env['default_serverless_devs_auto_log'] === 'false') {
      logger.log(`End of method: ${method}`, 'green');
      return result;
    }
    keys(result).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : this.doOutput(result);
    return result;
  }

  private async warnEnvironmentVariables(realVariables) {
    const services = realVariables?.services;
    if (isEmpty(services)) return;
    let envObj = {};
    for (const key in services) {
      const environmentVariables = get(
        services,
        [key, 'props', 'function', 'environmentVariables'],
        {},
      );
      envObj = Object.assign({}, envObj, environmentVariables);
    }
    const keys = [];
    for (const key in envObj) {
      if (isNil(envObj[key])) {
        keys.push(key);
      }
    }
    keys.length > 0 &&
      logger.warn(`The value of environment variable [${keys.join(', ')}] is undefined.`);
  }
}

async function execCommand(configs: IConfigs) {
  const lastArgv = process.argv;
  const debug = get(configs, 'globalArgs.debug');
  if (debug) {
    !includes(process.argv, '--debug') && process.argv.push('--debug');
  } else {
    process.argv = filter(process.argv, (item) => item !== '--debug');
  }
  const res = await new ExecCommand(configs).init();
  process.argv = lastArgv;
  return res;
}

export { execCommand, getTemplatePath, transforYamlPath, Parse as ParseVariable };
