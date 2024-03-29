import fs from 'fs-extra';
import path from 'path';
import { getRootHome, getYamlContent } from '../../../libs';

export default async function getAccess(accessAlias: string) {
  const globalPath = path.join(getRootHome(), 'access.yaml');
  if (!fs.existsSync(`${globalPath}`)) {
    fs.writeFileSync(globalPath, '');
  }
  const userInfo = await getYamlContent(globalPath);
  const data = {};
  if (userInfo) {
    Object.keys(userInfo).forEach((item) => {
      if (item === accessAlias) {
        data[item] = userInfo[item];
      }
    });
  }
  return data;
}
