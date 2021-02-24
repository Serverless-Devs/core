import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import yaml from 'js-yaml';

interface User {
  Provider?: string;
}

export default function getAccess(user: User) {
  const globalPath = path.join(os.homedir(), '.s/access.yaml');
  if (!fs.existsSync(`${globalPath}`)) {
    fs.writeFileSync(globalPath, '');
  }
  if (!user.Provider) return false;
  const content = fs.readFileSync(globalPath, 'utf8');
  let userInfo: { [x: string]: any };
  try {
    userInfo = yaml.safeLoad(content);
  } catch (error) {
    console.error(error);
  }
  const data = {};
  if (userInfo) {
    const provider = user.Provider.toLocaleLowerCase();
    Object.keys(userInfo).map((item) => {
      if (item.split('.')[0] === provider) {
        data[item] = userInfo[item];
      }
      return item;
    });
  }
  return data;
}
