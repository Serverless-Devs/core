import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { providerCollection, checkProviderList } from './constant';
import getYamlContent from '../getYamlContent';
import { getServerlessDevsTempArgv } from '../../libs/utils';
import { getRootHome } from '../../libs/common';

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

function output({ info, accessAlias }) {
  console.log('');
  console.info(`    Alias: ${accessAlias}`);
  Object.keys(info).forEach((item) => {
    console.info(`    ${item}: ${info[item]}`);
  });
  console.log('');
  console.info('Configuration successful');
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
    if (providerAliasKeys.includes(accessAlias) && !tempArgv.find((i) => i === '-f')) {
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
