import { modifyProps } from '../../../src/common';

const prop = {
  bucket: 'shl-website-test01',
  src: {
    src: './src',
    dist: './build',
    hook: 'npm run build',
    index: 'index.html',
    error: 'index.html',
  },
  region: 'cn-shanghai2',
  hosts: [
    {
      host: 'shl2.shihuali.top',
      https: {
        certInfo: {
          switch: 'on',
          certType: 'free',
          certName: 'xxx',
          serverCertificate: 'xxx',
          privateKey: 'xxx',
        },
        http2: 'on',
        forceHttps: 'on',
      },
      access: {
        referer: {
          refererType: 'blacklist',
          allowEmpty: true,
          referers: ['aliyun.com', 'taobao.com'],
        },
      },
    },
  ],
};

modifyProps(
  'website',
  prop,
  '/Users/shihuali/workspace/s-core/packages/core/test/fixtures/modifyProps/s.yml',
);
