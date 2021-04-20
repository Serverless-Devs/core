import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { providerCollection, checkProviderList } from './constant';
import i18n from '../../libs/i18n';
import getYamlContent from '../getYamlContent';

const Crypto = require('crypto-js');

async function handleCustom(info: any) {
  const option = [
    {
      type: 'list',
      name: 'name',
      message: 'Please select a type:',
      choices: [
        { name: i18n.__('Add key-value pairs'), value: 'add' },
        { name: i18n.__('End of adding key-value pairs'), value: 'over' },
      ],
    },
  ];
  const { name } = await inquirer.prompt(option);
  if (name === 'add') {
    const { key, value } = await inquirer.prompt([
      {
        type: 'input',
        message: i18n.__('Please enter key'),
        name: 'key',
      },
      {
        type: 'input',
        message: i18n.__('Please enter value'),
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
  const filePath = path.join(os.homedir(), '.s/access.yaml');
  const content = await getYamlContent(filePath);
  if (content) {
    const providerAliasKeys = Object.keys(content);
    if (providerAliasKeys.includes(accessAlias)) {
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
        fs.appendFileSync(filePath, yaml.dump({ [accessAlias]: encrypt(info) }));
        output({ info, accessAlias });
      } catch (err) {
        throw new Error('Configuration failed');
      }
    }
  } else {
    try {
      fs.writeFileSync(filePath, yaml.dump({ [accessAlias]: encrypt(info) }));
      output({ info, accessAlias });
    } catch (err) {
      throw new Error('Configuration failed');
    }
  }
  return data;
}

async function getAlias() {
  const filePath = path.join(os.homedir(), '.s/access.yaml');
  if (fs.existsSync(filePath)) {
    const info = await getYamlContent(filePath);
    const keys = info ? Object.keys(info).filter((item) => item.startsWith('default')) : [];
    if (keys.length === 0) {
      return 'default';
    }
    let max = '0';
    keys.forEach((item) => {
      const [, end] = item.split('-');
      if (end > max) {
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

export default setCredential;
