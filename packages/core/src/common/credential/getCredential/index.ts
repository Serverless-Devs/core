import inquirer from 'inquirer';
import { providerArray } from '../constant';
import getAccess from './getAccess';
import addAccess from '../setCredential';
import get from 'lodash.get';

/**
 *
 * @param accessAlias
 * @param ...envKeys
 * @returns
 * 更改:
 * 1. 没有provider概念
 * 2. 环境变量 第二个参数
 * getCredential(null, 'AccessKeyID', 'AccessKeySecret')
 * return {
 *  AccessKeyID: process.env.AccessKeyID
 *  AccessKeySecret: process.env.AccessKeySecret
 * }
 * 3. accessAlias默认会使用default密钥信息,如果使用default的时候，consle.log(使用默认的default密钥信息)
 * 4. 密钥加密
 */
async function getCredential(provider: string, accessAlias?: string) {
  if (!provider) {
    throw Error('The cloud vendor [provider] was required');
  }
  if (!providerArray.includes(provider)) {
    throw Error(
      `The cloud vendor[${provider}] was not found. [alibaba/aws/azure/baidu/google/huawei/tencent/custom]`,
    );
  }
  const AccountKeyIDFromEnv = get(process, 'env.AccessKeyID');
  const AccessKeySecretFromEnv = get(process, 'env.AccessKeySecret');
  if (AccountKeyIDFromEnv && AccessKeySecretFromEnv) {
    return {
      Alias: get(process, 'env.AccessKeySecret', 'default'),
      AccountID: get(process, 'env.AccountID'),
      AccessKeyID: AccountKeyIDFromEnv,
      AccessKeySecret: AccessKeySecretFromEnv,
    };
  }

  const accessContent = getAccess(provider, accessAlias);
  const accessKeys = Object.keys(accessContent);
  if (accessAlias && accessKeys.length > 0) {
    return accessContent[`${provider}.${accessAlias}`];
  }
  const choices = [];
  if (accessKeys.length === 0) {
    choices.push({
      name: `未找到${provider}${accessAlias ? `.${accessAlias}` : ''}的相关信息，选择此选项退出`,
      value: 'over',
    });
  } else {
    Object.keys(accessContent).forEach((item) => {
      const [start, end] = item.split('.');
      const temp = {
        name: `${start}: ${end}`,
        value: item,
      };
      choices.push(temp);
    });
  }
  choices.push({ name: 'Create a new account', value: 'create' });
  const { access } = await inquirer.prompt([
    {
      type: 'list',
      name: 'access',
      message: 'Please select an access:',
      choices,
    },
  ]);
  if (access === 'create') {
    return addAccess(provider);
  }
  const [, Alias] = access.split('.');
  const formatObj = accessContent[access];
  if (Object.prototype.hasOwnProperty.call(formatObj, 'AccountID')) {
    return {
      Alias,
      ...formatObj,
      AccountID:
        typeof formatObj.AccountID === 'string' ? formatObj.AccountID : String(formatObj.AccountID),
    };
  }
  return {
    Alias,
    ...formatObj,
  };
}

export default getCredential;
