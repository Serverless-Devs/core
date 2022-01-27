import Parse from './parse';
import { isEmpty, get, isNil, keys } from 'lodash';
import { logger } from '../../logger';
import Analysis from './analysis';
import { getProjectConfig, setupEnv } from './utils';
import { getTemplatePath } from '../../libs';
import ComponentExec from './component';
import { IGlobalArgs } from './interface';

interface IConfigs {
  syaml?: string;
  serverName?: string;
  method: string;
  args?: string[];
  globalArgs?: IGlobalArgs;
}

class ExecCommand {
  private configs: IConfigs;
  constructor(configs: IConfigs) {
    this.configs = configs;
  }
  async init() {
    const { syaml, serverName } = this.configs;
    const spath = await getTemplatePath(syaml);
    await setupEnv(spath);
    const parse = new Parse(spath);
    const parsedObj = await parse.init();
    await this.warnEnvironmentVariables(parsedObj.realVariables);
    const analysis = new Analysis(parsedObj.realVariables, parsedObj.dependenciesMap);
    const executeOrderList = analysis.getProjectOrder();
    // 只有一个服务，或者指定服务操作
    if (executeOrderList.length === 1 || serverName) {
      const tempCustomerCommandName = executeOrderList[0];
      return await this.serviceOnlyOne({
        realVariables: parsedObj.realVariables,
        serverName: serverName || tempCustomerCommandName,
        spath,
        specifyService: Boolean(serverName),
      });
    }
    return await this.serviceWithMany({ executeOrderList, parse, spath });
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
    }).init();
    const result = { [serverName]: outPutData };
    keys(outPutData).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : logger.output(result);
    return result;
  }

  private async serviceWithMany({ executeOrderList, parse, spath }) {
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
      const parsedObj = await parse.init(tempData);
      const projectConfig = getProjectConfig(parsedObj.realVariables, serverName, globalArgs);
      const outputData = await new ComponentExec({
        projectConfig,
        method,
        args,
        spath,
        serverName,
        globalArgs,
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

export default execCommand;