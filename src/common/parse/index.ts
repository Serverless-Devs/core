import Parse from './parse';
import { isEmpty, get, isNil, keys } from 'lodash';
import { logger, emoji } from '../../libs/utils';
import chalk from 'chalk';
import Analysis from './analysis';
import { getTemplatePath, getProjectConfig, setupEnv } from './utils';
import ComponentExec from './component';

interface IConfigs {
  syaml: string;
  serverName?: string;
  method?: string;
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
    if (spath) {
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
    } else {
      this.notFound(syaml);
      process.exit(1);
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
  notFound(syaml: string) {
    logger.error(`Failed to execute:\n
    ${emoji(
      '❌',
    )} Message: Cannot find s.yaml / s.yml / template.yaml / template.yml file, please check the directory ${syaml}
    ${emoji(
      '🧭',
    )} If you want to use Serverless Devs, you should have a s.yaml or use [s cli] command.
    ${emoji('1️⃣')} Yaml document: ${chalk.underline(
      'https://github.com/Serverless-Devs/docs/blob/master/zh/yaml.md',
    )}
    ${emoji('2️⃣')} Cli document: [s cli -h]
    ${emoji('😈')} If you have questions, please tell us: ${chalk.underline(
      'https://github.com/Serverless-Devs/Serverless-Devs/issues',
    )}\n`);
  }
}

async function parse(configs: IConfigs) {
  return await new MyParse(configs).init();
}

export default parse;
