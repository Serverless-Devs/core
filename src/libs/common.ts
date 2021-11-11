/**
 * @description 业务通用代码
 */

import os from 'os';
import path from 'path';

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

export function getRootHome() {
  return path.join(os.homedir(), '.s');
}

export const S_CURRENT_HOME = path.join(process.cwd(), '.s');

export const S_CURRENT = path.join(process.cwd(), './');

export const S_ROOT_HOME_ACCESS = path.join(getRootHome(), 'access.yaml');

export const S_ROOT_HOME_COMPONENT = path.join(getRootHome(), 'components');
