import { ALIYUN_CLI } from './constant';
import { getCredential, getCredentialFromEnv } from './credential';
import path from 'path';
import { getRootHome, getYamlContent } from '../libs';
import { get } from 'lodash';

const getAccountByAccess = async (access: string) => {
  if (!access) return;
  if (access === ALIYUN_CLI) {
    return await getCredential(access);
  }
  const accessPath = path.join(getRootHome(), 'access.yaml');
  const data = await getYamlContent(accessPath);

  let credentials;
  // 密钥存在 才去获取密钥信息
  if (get(data, access)) {
    credentials = await getCredential(access);
  }
  const accessFromEnv = await getCredentialFromEnv(access);
  if (accessFromEnv) {
    credentials = accessFromEnv;
  }
  return credentials;
};

export default getAccountByAccess;
