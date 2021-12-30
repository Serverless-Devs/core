import Core from '@alicloud/pop-core';

interface IConfig {
  AccessKeyID: string;
  AccessKeySecret: string;
  SecurityToken?: string;
}

export default async (config: IConfig) => {
  const params = {
    accessKeyId: config.AccessKeyID,
    accessKeySecret: config.AccessKeySecret,
    securityToken: config.SecurityToken,
    endpoint: 'https://sts.cn-hangzhou.aliyuncs.com',
    apiVersion: '2015-04-01',
  };
  const client = new Core(params);

  const result = await client.request(
    'GetCallerIdentity',
    {},
    {
      method: 'POST',
    },
  );
  return result;
};
