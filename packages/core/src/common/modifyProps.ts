import { S_CURRENT } from '../libs/common';
import { merge } from '../libs/utils';
const fs = require('fs-extra');
const yaml = require('js-yaml');

async function modifyProps(service: string, options: object) {
  const filePath = `${S_CURRENT}/s.yaml`;
  let userInfo: { [x: string]: any };
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    userInfo = yaml.safeLoad(content);
  } catch (error) {
    // ignore
  }
  userInfo[service].Properties = merge(userInfo[service].Properties, options);
  fs.writeFileSync(filePath, yaml.dump(userInfo));
}

export default modifyProps;
