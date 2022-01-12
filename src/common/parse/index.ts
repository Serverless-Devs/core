import Parse from './parse';
import { isEmpty, get, isNil, keys, find } from 'lodash';
import { logger } from '../../libs/utils';
import Analysis from './analysis';
import { getTemplatePath, getProjectConfig, setupEnv, getFileObj } from './utils';
import ComponentExec from './component';

interface IConfigs {
  syaml?: string;
  serverName?: string;
  method: string;
  args?: string;
}

class MyParse {
  private configs: IConfigs;
  constructor(configs: IConfigs) {
    this.configs = configs;
  }
  async init() {
    const { syaml, serverName } = this.configs;
    const spath = await getTemplatePath(syaml);
    if (isEmpty(spath)) {
      throw new Error(`${syaml} file not found`);
    }
    await this.validateServerName(spath);
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
      });
    }
    return await this.serviceWithMany({ executeOrderList, parse, spath });
  }
  async validateServerName(filePath: string) {
    const { serverName } = this.configs;
    if (!serverName) return;
    const data: any = getFileObj(filePath);
    if (!find(keys(data.services), (o) => o === serverName)) {
      throw new Error(`${serverName} server not found`);
    }
  }
  async serviceOnlyOne({ realVariables, serverName, spath }) {
    const { method, args = '' } = this.configs;
    const projectConfig = getProjectConfig(realVariables, serverName);
    const outPutData = await new ComponentExec({
      projectConfig,
      method,
      args,
      spath,
      serverName,
    }).init();
    const result = { [serverName]: outPutData };
    keys(outPutData).length === 0
      ? logger.log(`End of method: ${method}`, 'green')
      : logger.output(result);
    return result;
  }

  async serviceWithMany({ executeOrderList, parse, spath }) {
    const { method, args = '' } = this.configs;
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
      const projectConfig = getProjectConfig(parsedObj.realVariables, serverName);
      const outputData = await new ComponentExec({
        projectConfig,
        method,
        args,
        spath,
        serverName,
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

  async warnEnvironmentVariables(realVariables) {
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

async function parse(configs: IConfigs) {
  return await new MyParse(configs).init();
}

export default parse;
