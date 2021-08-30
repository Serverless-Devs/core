import os from 'os';
import path from 'path';
import getYamlContent from '../getYamlContent';

export async function getSetConfig(key) {
  const setConfigPath = path.join(os.homedir(), '.s', 'set-config.yml');
  const res = await getYamlContent(setConfigPath);
  if (!res) return;
  return res[key];
}
