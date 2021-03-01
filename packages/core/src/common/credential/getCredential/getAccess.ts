import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import yaml from 'js-yaml';

export default function getAccess(provider: string, accessAlias?: string) {
  const globalPath = path.join(os.homedir(), '.s/access.yaml');
  if (!fs.existsSync(`${globalPath}`)) {
    fs.writeFileSync(globalPath, '');
  }
  const content = fs.readFileSync(globalPath, 'utf8');
  let userInfo: { [x: string]: any };
  try {
    userInfo = yaml.safeLoad(content);
  } catch (error) {
    console.error(error);
  }
  const data = {};
  if (userInfo) {
    Object.keys(userInfo).map((item) => {
      if (accessAlias) {
        if (item === `${provider}.${accessAlias}`) {
          data[item] = userInfo[item];
        }
        return item;
      }

      if (item.split('.')[0] === provider) {
        data[item] = userInfo[item];
      }
      return item;
    });
  }
  return data;
}
