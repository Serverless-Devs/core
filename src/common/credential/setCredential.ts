import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { providerCollection, checkProviderList } from './constant';
import { getServerlessDevsTempArgv, getYamlContent, getRootHome } from '../../libs';
import { logger } from '../../logger';
import getAccountId from './getAccountId';
import spinner from '../spinner';
import { isEmpty } from 'lodash';
import chalk from 'chalk';

const Crypto = require('crypto-js');

async function handleCustom(info: any) {
  const option = [
    {
      type: 'list',
      name: 'name',
      message: 'Please select a type:',
      choices: [
        { name: 'Add key-value pairs', value: 'add' },
        { name: 'End of adding key-value pairs', value: 'over' },
      ],
    },
  ];
  const { name } = await inquirer.prompt(option);
  if (name === 'add') {
    const { key, value } = await inquirer.prompt([
      {
        type: 'input',
        message: 'Please enter key',
        name: 'key',
      },
      {
        type: 'input',
        message: 'Please enter value',
        name: 'value',
      },
    ]);
    info[key] = value;
    await handleCustom(info);
  }
}

function secret(tempAccess) {
  if (isEmpty(tempAccess)) return tempAccess;
  const tempSecretAccess = {};
  for (const eveValue in tempAccess) {
    const valueLength = tempAccess[eveValue].length;
    tempSecretAccess[eveValue] =
      valueLength > 6
        ? tempAccess[eveValue].slice(0, 3) +
          '*'.repeat(valueLength - 6) +
          tempAccess[eveValue].slice(valueLength - 3, valueLength)
        : tempAccess[eveValue];
  }
  return tempSecretAccess;
}

function output({ info, accessAlias }) {
  console.log('');
  logger.output(
    {
      Alias: accessAlias,
      ...secret(info),
    },
    2,
  );
  console.log('');
  spinner('Configuration successful').succeed();
}

function encrypt(info: any = {}) {
  const cloneInfo = Object.assign({}, info);
  Object.keys(cloneInfo).forEach((key) => {
    const ciphertext = Crypto.AES.encrypt(cloneInfo[key], 'SecretKey123');
    cloneInfo[key] = ciphertext.toString();
  });
  return cloneInfo;
}

async function writeData(data: any) {
  const { info, accessAlias } = data;
  const filePath = path.join(getRootHome(), 'access.yaml');
  const content = await getYamlContent(filePath);
  if (content) {
    const providerAliasKeys = Object.keys(content);
    const tempArgv = getServerlessDevsTempArgv();
    if (providerAliasKeys.includes(accessAlias) && !tempArgv.f) {
      const option = [
        {
          type: 'list',
          name: 'name',
          message: 'Alias already exists. Please select a type:',
          choices: [
            { name: 'overwrite', value: 'overwrite' },
            { name: 'rename', value: 'rename' },
            { name: 'exit', value: 'exit' },
          ],
        },
      ];
      const { name } = await inquirer.prompt(option);
      if (name === 'overwrite') {
        content[accessAlias] = encrypt(info);
        fs.writeFileSync(filePath, yaml.dump(content));
        output({ info, accessAlias });
      }
      if (name === 'rename') {
        const accessAliasObj = [
          {
            type: 'input',
            message: 'Please create alias for key pair. If not, please enter to skip',
            name: 'aliasName',
            default: await getAlias(),
          },
        ];
        const { aliasName } = await inquirer.prompt(accessAliasObj);
        return await writeData({ info, accessAlias: aliasName });
      }
    } else {
      try {
        content[accessAlias] = encrypt(info);
        fs.writeFileSync(filePath, yaml.dump(content));
        output({ info, accessAlias });
      } catch (err) {
        throw new Error('Configuration failed');
      }
    }
  } else {
    try {
      fs.ensureFileSync(filePath);
      fs.writeFileSync(filePath, yaml.dump({ [accessAlias]: encrypt(info) }));
      output({ info, accessAlias });
    } catch (err) {
      throw new Error('Configuration failed');
    }
  }
  return data;
}

async function getAlias() {
  const filePath = path.join(getRootHome(), 'access.yaml');
  if (fs.existsSync(filePath)) {
    const info = await getYamlContent(filePath);
    const keys = info ? Object.keys(info).filter((item) => item.startsWith('default')) : [];
    if (keys.length === 0) {
      return 'default';
    }
    let max = '0';
    keys.forEach((item) => {
      const [, end] = item.split('-');
      if (!isNaN(parseInt(end)) && end > max) {
        max = end;
      }
    });
    return `default-${parseInt(max) + 1}`;
  }
  return 'default';
}

/**
 * @param args 可选参数，接收设置密钥的key，如果不传方法内部提供了设置密钥的相关模版
 */
async function setCredential(...args: any[]) {
  let selectedProvider: string;
  let info: any;
  if (args.length > 0) {
    selectedProvider = 'params';
  } else {
    const answers: any = await inquirer.prompt(checkProviderList);
    selectedProvider = answers.provider;
  }
  if (
    ['alibaba', 'aws', 'azure', 'baidu', 'google', 'huawei', 'tencent'].includes(selectedProvider)
  ) {
    console.log(
      `🧭 Refer to the document for ${selectedProvider} key: `,
      {
        alibaba: 'http://config.devsapp.net/account/alibaba',
        aws: 'http://config.devsapp.net/account/aws',
        azure: 'http://config.devsapp.net/account/azure',
        baidu: 'http://config.devsapp.net/account/baidu',
        google: 'http://config.devsapp.net/account/gcp',
        huawei: 'http://config.devsapp.net/account/huawei',
        tencent: 'http://config.devsapp.net/account/tencent',
      }[selectedProvider],
    );
  }

  let accessAlias: string;
  const accessAliasObj = {
    type: 'input',
    message: 'Please create alias for key pair. If not, please enter to skip',
    name: 'aliasName',
    default: await getAlias(),
  };
  if (selectedProvider === 'custom') {
    await handleCustom((info = {}));
    const res = await inquirer.prompt([accessAliasObj]);
    accessAlias = res.aliasName;
  } else {
    const argsPrompt = args.map((item) => ({
      type: 'input',
      message: item,
      name: item,
    }));

    const promptList =
      selectedProvider === 'params' ? argsPrompt : providerCollection[selectedProvider];
    promptList.push(accessAliasObj);
    info = await inquirer.prompt(promptList);
    // 阿里云密钥 获取accountid
    if (selectedProvider === 'alibaba') {
      try {
        const data: any = await getAccountId(info);
        info.AccountID = data.AccountId;
      } catch (error) {
        throw new Error(
          JSON.stringify({
            message: 'You are configuring an incorrect Alibaba Cloud SecretKey.',
            tips: `Please check the accuracy of Alibaba Cloud SecretKey. documents: ${chalk.underline(
              'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/default_provider_config/alibabacloud.md',
            )}`,
          }),
        );
      }
    }

    Object.keys(info).forEach((item) => {
      if (item === 'aliasName') {
        accessAlias = info[item];
        delete info[item];
      }
    });
  }
  const { accessAlias: Alias } = await writeData({ info, accessAlias });
  return {
    Alias,
    ...info,
  };
}

/**
 * @param args 接收设置密钥的key
 */
export async function setKnownCredential(info, accessAlias) {
  const aliasName = accessAlias || (await getAlias());
  await writeData({ info, accessAlias: aliasName });
  return {
    Alias: aliasName,
    ...info,
  };
}

export default setCredential;
