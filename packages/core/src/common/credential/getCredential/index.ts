import inquirer from 'inquirer';
import getAccess from './getAccess';
import setCredential from '../setCredential';
import get from 'lodash.get';
const CryptoTS = require('crypto-ts');

function decrypt(info: any = {}) {
  const cloneInfo = Object.assign({}, info);
  Object.keys(cloneInfo).forEach((key) => {
    const bytes = CryptoTS.AES.decrypt(cloneInfo[key], 'SecretKey123');
    cloneInfo[key] = bytes.toString(CryptoTS.enc.Utf8);
  });
  return cloneInfo;
}

/**
 * @param access 可选参数，密钥的别名
 * @param args 可选参数，接收设置密钥的key，如果不传新建密钥的时候，方法内部提供了设置密钥的相关模版
 */
async function getCredential(access?: string, ...args: any[]) {
  let accessAlias: string;
  if (access) {
    accessAlias = access;
  } else {
    console.log('使用默认的default密钥信息');
    accessAlias = 'default';
  }

  // 从环境变量获取
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

  const accessContent = await getAccess(accessAlias);

  const accessKeys = Object.keys(accessContent);

  // 找到已经创建过的密钥，直接返回密钥信息
  if (accessKeys.length > 0) {
    const formatObj = decrypt(accessContent[accessAlias]);
    if (Object.prototype.hasOwnProperty.call(formatObj, 'AccountID')) {
      return {
        Alias: accessAlias,
        ...formatObj,
        AccountID:
          typeof formatObj.AccountID === 'string'
            ? formatObj.AccountID
            : String(formatObj.AccountID),
      };
    }
    return {
      Alias: accessAlias,
      ...formatObj,
    };
  }

  const choices = [
    {
      name: `未找到${accessAlias}的相关信息，选择此选项退出`,
      value: 'over',
    },
    { name: 'Create a new account', value: 'create' },
  ];
  const { access: selectAccess } = await inquirer.prompt([
    {
      type: 'list',
      name: 'access',
      message: 'Please select an access:',
      choices,
    },
  ]);
  if (selectAccess === 'create') {
    return setCredential(...args);
  }
}

export default getCredential;
