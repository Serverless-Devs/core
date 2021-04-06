import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { providerCollection, checkProviderList } from './constant';
import i18n from '../../libs/i18n';
import getYamlContent from '../getYamlContent';
const CryptoTS = require('crypto-ts');

async function handleCustom(info: any) {
  const option = {
    type: 'list',
    name: 'name',
    message: 'Please select a type:',
    choices: [
      { name: i18n.__('Add key-value pairs'), value: 'add' },
      { name: i18n.__('End of adding key-value pairs'), value: 'over' },
    ],
  };
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
    const ciphertext = CryptoTS.AES.encrypt(cloneInfo[key], 'SecretKey123');
    cloneInfo[key] = ciphertext.toString();
  });
  return cloneInfo;
}

async function writeData({ info, accessAlias }) {
  const filePath = path.join(os.homedir(), '.s/access.yaml');
  const content = await getYamlContent(filePath);
  if (content) {
    const providerAliasKeys = Object.keys(content);
    if (providerAliasKeys.includes(accessAlias)) {
      throw Error(
        `Alias already exists. You can set a different alias or modify it through: s config update -a ${accessAlias}`,
      );
    } else {
      try {
        fs.appendFileSync(filePath, yaml.dump({ [accessAlias]: encrypt(info) }));
        output({ info, accessAlias });
      } catch (err) {
        throw Error('Configuration failed');
      }
    }
  } else {
    try {
      fs.writeFileSync(filePath, yaml.dump({ [accessAlias]: encrypt(info) }));
      output({ info, accessAlias });
    } catch (err) {
      throw Error('Configuration failed');
    }
  }
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
    default: 'default',
  };
  if (selectedProvider === 'custom') {
    await handleCustom((info = {}));
    const res = await inquirer.prompt(accessAliasObj);
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
  await writeData({ info, accessAlias });
  return {
    Alias: accessAlias,
    ...info,
  };
}

export default setCredential;
