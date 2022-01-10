import fs from 'fs-extra';
import { endsWith, isEmpty } from 'lodash';
import getYamlContent from '../getYamlContent';
import path from 'path';

async function validateTemplateFile(spath: string): Promise<boolean> {
  if (isEmpty(spath)) return false;
  try {
    if (endsWith('json')) {
      const data = fs.readJSONSync(spath);
      return data.hasOwnProperty('edition');
    }
    const data = await getYamlContent(spath);
    return data.hasOwnProperty('edition');
  } catch (error) {
    return false;
  }
}

export async function getTemplatePath(spath: string) {
  if (await validateTemplateFile(spath)) return spath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (await validateTemplateFile(sYamlPath)) return sYamlPath;
  const sJsonPath = path.join(cwd, 's.json');
  if (await validateTemplateFile(sJsonPath)) return sJsonPath;
}
