import path from 'path';
import getYamlContent from '../getYamlContent';
import { getRootHome } from '../../libs/common';

export async function getSetConfig(key) {
  const setConfigPath = path.join(getRootHome(), 'set-config.yml');
  const res = await getYamlContent(setConfigPath);
  if (!res) return;
  return res[key];
}
