import { getTemplatePath } from './utils';
import Parse from './parse';
import { isEmpty, get, isNil } from 'lodash';
import { logger, emoji } from '../../libs/utils';
import chalk from 'chalk';
import Analysis from './analysis';

interface IConfigs {
  syaml: string;
  serverName?: string;
}

async function parse(configs: IConfigs) {
  const { syaml, serverName } = configs;
  const spath = await getTemplatePath(syaml);
  if (spath) {
    const parse = await new Parse(spath).init();
    await warnEnvironmentVariables(parse.realVariables);
    const analysis = new Analysis(parse.realVariables, parse.dependenciesMap);
    const executeOrderList = analysis.getProjectOrder();
    console.log(executeOrderList);
    if (executeOrderList.length === 1 || serverName) {
      await serviceOnlyOne();
    } else {
      await serviceWithMany();
    }
  } else {
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
    process.exit(1);
  }
}

async function warnEnvironmentVariables(realVariables) {
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

async function serviceOnlyOne() {}

async function serviceWithMany() {}

export default parse;
