import inquirer from 'inquirer';
import getAccess from './getAccess';
import setCredential from '../setCredential';
import { get, keys, filter, find, concat } from 'lodash';
import os from 'os';
import path from 'path';
import { getYamlContent, getRootHome, getConfig, setConfig } from '../../../libs';
import { logger } from '../../../logger';
import chalk from 'chalk';
import { transformInputs, trim, getServerlessDevsAccessFromEnv } from './utils';
import { ALIYUN_CLI, ALIYUN_CONFIG_FILE } from '../../constant';
import Acc from '@serverless-devs/acc/commands/run';
import fs from 'fs-extra';
import getAccountId from '../getAccountId';
import { isCiCdEnvironment } from '@serverless-devs/utils';

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

  let result;
  if (access === ALIYUN_CLI) {
    result = await getAcc();
  } else {
    const aliasFromEnv = process.env.serverless_devs_access_cicd_alias_name;
    if (isCiCdEnvironment() && aliasFromEnv) {
      access = aliasFromEnv;
    }
    result = await getCredentialWithAccess(access, ...params);
  }

  transformInputs(inputs, result);
  return result;
}

async function getAcc() {
  const configPath = process.env.ALIBABACLOUD_CONFIG || ALIYUN_CONFIG_FILE;
  if (fs.existsSync(configPath)) {
    let accData;
    try {
      accData = await new Acc().run([]);
    } catch (error) {
      logger.debug(error);
    }
    if (accData?.AccessKeyID && accData?.AccessKeySecret) {
      const stockData = getConfig('acc');
      const findObj = find(stockData, (o) => o.AccessKeyID === accData.AccessKeyID);
      if (findObj) {
        return {
          ...accData,
          AccountID: findObj.AccountId,
          Alias: ALIYUN_CLI,
        };
      }
      const info: any = await getAccountId(accData);
      const tmp = [
        {
          AccountId: info.AccountId,
          AccessKeyID: accData.AccessKeyID,
        },
      ];
      setConfig('acc', stockData ? concat(stockData, tmp) : tmp);
      return {
        ...accData,
        AccountID: info.AccountId,
        Alias: ALIYUN_CLI,
      };
    }
  }
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

/**
 * @param access 可选参数，密钥的别名
 * @param args 可选参数，接收设置密钥的key，如果不传新建密钥的时候，方法内部提供了设置密钥的相关模版
 */
async function getCredentialWithAccess(access?: string, ...args: any[]) {
  const accessAlias = access || 'default';
  // 从环境变量获取
  const data = await getCredentialFromEnv(access);
  if (data) {
    return data;
  }

  const accessContent = await getAccess(accessAlias);

  const accessKeys = Object.keys(accessContent);

  // 找到已经创建过的密钥，直接返回密钥信息
  if (accessKeys.length > 0) {
    const result = formatValue(accessContent, accessAlias);
    logger.debug(`access information: ${JSON.stringify(result, null, 2)}`);
    return trim(result);
  }

  if (isCiCdEnvironment()) {
    // cicd 环境未获取到密钥信息，抛出异常
    throw new Error(
      JSON.stringify({
        tips: 'In the cicd environment, the credential information is not obtained.',
      }),
    );
  }

  const userInfo = await getYamlContent(path.join(getRootHome(), 'access.yaml'));

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
    `\n\n${os.platform() == 'win32' ? '' : '🤡'
    }   If you don't want to select access every time, configure it in yaml：${chalk.underline.cyan(
      'https://github.com/Serverless-Devs/Serverless-Devs/discussions/149',
    )}\n\n`,
  );

  logger.debug(`access information: ${JSON.stringify(result, null, 2)}`);
  return trim(result);
}

export async function getCredentialFromEnv(access?: string) {
  require('dotenv').config();
  const AccountKeyIDFromEnv = get(process, 'env.AccessKeyID');
  const AccessKeySecretFromEnv = get(process, 'env.AccessKeySecret');
  const AccountIDFromEnv = get(process, 'env.AccountID');
  if (
    AccountKeyIDFromEnv &&
    AccessKeySecretFromEnv &&
    AccountIDFromEnv &&
    process.env.serverless_devs_temp_argv !== '["config","get"]'
  ) {
    return trim({
      Alias: 'default_serverless_devs_access',
      AccountID: AccountIDFromEnv,
      AccessKeyID: AccountKeyIDFromEnv,
      AccessKeySecret: AccessKeySecretFromEnv,
      SecurityToken: get(process, 'env.SecurityToken'),
    });
  }
  const serverlessDevsAccessFromEnv = getServerlessDevsAccessFromEnv(access);
  if (serverlessDevsAccessFromEnv) {
    return trim(serverlessDevsAccessFromEnv);
  }
}

export const getCredentialAliasList = async () => {
  let accessList = [];
  const accessInfo = await getYamlContent(path.join(getRootHome(), 'access.yaml'));
  if (accessInfo) {
    accessList = keys(accessInfo);
  }
  const data = await getCredentialFromEnv();
  if (data) {
    accessList = filter(accessList, (o) => o !== data.Alias);
    accessList.push(data.Alias);
  }
  return accessList;
};

export default getCredential;
