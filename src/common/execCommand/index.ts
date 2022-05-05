import Parse from './parse';
import { isEmpty, get, isNil, keys, isPlainObject } from 'lodash';
import { logger } from '../../logger';
import Analysis from './analysis';
import { getProjectConfig } from './utils';
import { getTemplatePath, transforYamlPath } from './getTemplatePath';
import ComponentExec from './component';
import { IGlobalArgs } from './interface';

interface IConfigs {
  syaml?: string;
  serverName?: string;
  method: string;
  args?: string[];
  env: object;
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
  }
  async init() {
    const { syaml, serverName } = this.configs;
    const originSpath = await getTemplatePath(syaml);
    const spath = await transforYamlPath(originSpath);
    this.parse = new Parse(spath);
    let parsedObj = await this.parse.init();
    // 兼容vars下的魔法变量，需再次解析
    parsedObj = await this.parse.init(parsedObj.realVariables);
    await this.warnEnvironmentVariables(parsedObj.realVariables);
    const analysis = new Analysis(parsedObj.realVariables, parsedObj.dependenciesMap);
    const executeOrderList = analysis.getProjectOrder();
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
    const outPutData = await new ComponentExec({
      projectConfig,
      method,
      args,
      spath,
      serverName,
      globalArgs,
      specifyService,
      parse: this.parse, // 如果actions模块包含魔法变量，需要再次解析
    }).init();
    const result = { [serverName]: outPutData };
    keys(outPutData).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : logger.output(result);
    return result;
  }

  private async serviceWithMany({ executeOrderList, spath }) {
    const { method, args, globalArgs } = this.configs;
    logger.info(
      `It is detected that your project has the following projects < ${executeOrderList.join(
        ',',
      )} > to be execute`,
    );
    const result = {};
    // 临时存储output, 对yaml文件再次解析
    const tempData = { services: {} };
    for (const serverName of executeOrderList) {
      logger.info(`Start executing project ${serverName}`);
      const parsedObj = await this.parse.clearGlobalKey('this').init(tempData);
      const projectConfig = getProjectConfig(parsedObj.realVariables, serverName, globalArgs);
      const outputData = await new ComponentExec({
        projectConfig,
        method,
        args,
        spath,
        serverName,
        globalArgs,
        parse: this.parse,
      }).init();
      tempData.services[serverName] = { output: outputData };
      result[serverName] = outputData;
      logger.info(`Project ${serverName} successfully to execute \n\t`);
    }
    keys(result).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : logger.output(result);
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
  return await new ExecCommand(configs).init();
}

export { execCommand, getTemplatePath, transforYamlPath };
