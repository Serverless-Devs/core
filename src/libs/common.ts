/**
 * @description 业务通用代码
 */

import os from 'os';
import path from 'path';
import fs from 'fs-extra';
const semver = require('semver');

const USER_HOME = os.homedir();

// s工具的家目录

export function getCicdEnv() {
  for (const key in process.env) {
    if (key.startsWith('CLOUDSHELL')) return 'aliyun_ecs';
    if (key.startsWith('PIPELINE')) return 'yunxiao';
    if (key.startsWith('GITHUB')) return 'github';
    if (key.startsWith('GITLAB')) return 'gitlab';
    if (key.startsWith('JENKINS')) return 'jenkins';
  }
}

export function formatWorkspacePath(val: string) {
  return val.replace(/~/, USER_HOME);
}

export function getConfig(key?: string, defaultValue?: any) {
  const sJsonPath = path.join(getRootHome(), 'config', 's.json');
  if (fs.existsSync(sJsonPath)) {
    const data = fs.readJsonSync(sJsonPath);
    const val = key ? data[key] : data;
    return val || defaultValue;
  }
}

export function setConfig(key: string, value: any) {
  if (key === 'workspace') {
    const shomedir = path.join(USER_HOME, '.s');
    const sJsonPath = path.join(shomedir, 'config', 's.json');
    if (fs.existsSync(sJsonPath)) {
      const data = fs.readJsonSync(sJsonPath);
      data[key] = formatWorkspacePath(value);
      fs.writeJsonSync(sJsonPath, data);
    } else {
      fs.ensureFileSync(sJsonPath);
      fs.writeJsonSync(sJsonPath, { [key]: formatWorkspacePath(value) });
    }
    return;
  }

  const sJsonPath = path.join(getRootHome(), 'config', 's.json');
  if (fs.existsSync(sJsonPath)) {
    const data = fs.readJsonSync(sJsonPath);
    data[key] = value;
    fs.writeJsonSync(sJsonPath, data);
  } else {
    fs.ensureFileSync(sJsonPath);
    fs.writeJsonSync(sJsonPath, { [key]: value });
  }
}

export const getCliVersion = (defaultValue?: string) => {
  const { CLI_VERSION } = process.env;
  return CLI_VERSION || defaultValue;
};

export function getRootHome() {
  const shomedir = path.join(USER_HOME, '.s');
  const sJsonPath = path.join(shomedir, 'config', 's.json');
  if (fs.existsSync(sJsonPath)) {
    const data = fs.readJsonSync(sJsonPath);
    return data.workspace ? formatWorkspacePath(data.workspace) : shomedir;
  }
  // 不存在 ～/.s/config/s.json
  if (semver.gt(getCliVersion('0.0.0'), '2.0.92')) {
    const env = getCicdEnv();
    if (env === 'yunxiao') return path.join(USER_HOME, '.cache', '.s');
  }
  return shomedir;
}

export const isBetaS = getCliVersion('0.0.0').includes('beta');

export const S_CURRENT_HOME = path.join(process.cwd(), '.s');

export const S_CURRENT = path.join(process.cwd(), './');

export const getSComponentPath = () => path.join(getRootHome(), 'components');
