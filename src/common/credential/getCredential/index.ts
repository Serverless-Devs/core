import inquirer from 'inquirer';
import getAccess from './getAccess';
import setCredential from '../setCredential';
import get from 'lodash.get';
import os from 'os';
import path from 'path';
import getYamlContent from '../../getYamlContent';
import { logger } from '../../../libs/utils';
import chalk from 'chalk';

const Crypto = require('crypto-js');

export function decryptCredential(info: { [key: string]: any }) {
  const cloneInfo = Object.assign({}, info);
  Object.keys(cloneInfo).forEach((key) => {
    try {
      const bytes = Crypto.AES.decrypt(cloneInfo[key], 'SecretKey123');
      cloneInfo[key] = bytes.toString(Crypto.enc.Utf8) || cloneInfo[key];
    } catch (error) {
      // ignore error
    }
  });
  return cloneInfo;
}

async function getCredential(...args: any[]) {
  const [first, second, ...rest] = args;
  let access: string;
  let params = [];
  let inputs: any;
  if (typeof first === 'object') {
    inputs = first;
    access = second;
    params = rest;
  } else {
    access = first;
    params = second ? [second, ...rest] : [];
  }
  const result = await getCredentialWithAccess(access, ...params);
  transformInputs(inputs, result);
  return result;
}

function transformInputs(inputs, result) {
  if (!inputs || !result) return;
  const { Alias } = result;
  inputs.project = { ...inputs.project, access: Alias };
  inputs.Project = { ...inputs.Project, accessAlias: Alias, AccessAlias: Alias };
  inputs.credentials = result;
  inputs.Credentials = result;
}

function formatValue(content: any, alias: string) {
  const formatObj = decryptCredential(content[alias]);
  if (Object.prototype.hasOwnProperty.call(formatObj, 'AccountID')) {
    return {
      Alias: alias,
      ...formatObj,
      AccountID:
        typeof formatObj.AccountID === 'string' ? formatObj.AccountID : String(formatObj.AccountID),
    };
  }
  return {
    Alias: alias,
    ...formatObj,
  };
}

function trim(obj) {
  for (const key in obj) {
    obj[key] = obj[key] && obj[key].replace(/(^\s*)|(\s*$)/g, '');
  }
  return obj;
}

/**
 * @param access 可选参数，密钥的别名
 * @param args 可选参数，接收设置密钥的key，如果不传新建密钥的时候，方法内部提供了设置密钥的相关模版
 */
async function getCredentialWithAccess(access?: string, ...args: any[]) {
  const accessAlias = access || 'default';
  // 从环境变量获取
  const AccountKeyIDFromEnv = get(process, 'env.AccessKeyID');
  const AccessKeySecretFromEnv = get(process, 'env.AccessKeySecret');

  if (AccountKeyIDFromEnv && AccessKeySecretFromEnv) {
    return trim({
      Alias: get(process, 'env.AccessKeySecret', 'default'),
      AccountID: get(process, 'env.AccountID'),
      AccessKeyID: AccountKeyIDFromEnv,
      AccessKeySecret: AccessKeySecretFromEnv,
      SecurityToken: get(process, 'env.SecurityToken'),
    });
  }

  const accessContent = await getAccess(accessAlias);

  const accessKeys = Object.keys(accessContent);

  // 找到已经创建过的密钥，直接返回密钥信息
  if (accessKeys.length > 0) {
    const result = formatValue(accessContent, accessAlias);
    logger.debug(`密钥信息: ${JSON.stringify(result, null, 2)}`);
    return trim(result);
  }
  const userInfo = await getYamlContent(path.join(os.homedir(), '.s/access.yaml'));

  let choices = [];
  if (userInfo) {
    choices = Object.keys(userInfo).map((item) => ({
      name: item,
      value: item,
    }));
  }
  choices = [
    {
      name: `${accessAlias} is not found, select this option to exit`,
      value: 'over',
    },
  ]
    .concat(choices)
    .concat([{ name: 'Create a new account', value: 'create' }]);

  const { access: selectAccess } = await inquirer.prompt([
    {
      type: 'list',
      name: 'access',
      message: 'Please select an access:',
      choices,
    },
  ]);
  if (selectAccess === 'over') return;
  if (selectAccess === 'create') {
    const res = await setCredential(...args);
    return trim(res);
  }
  const result = formatValue(userInfo, selectAccess);
  logger.warn(
    `\n\n${
      os.platform() == 'win32' ? '' : '🤡'
    }   If you don't want to select access every time, configure it in yaml：${chalk.underline.cyan(
      'https://github.com/Serverless-Devs/Serverless-Devs/discussions/149',
    )}\n\n`,
  );

  logger.debug(`密钥信息: ${JSON.stringify(result, null, 2)}`);
  return trim(result);
}

export default getCredential;
