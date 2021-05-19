/**
 * @description 业务通用代码
 */

const os = require('os');
const path = require('path');

// s工具的家目录
export const S_ROOT_HOME = path.join(os.homedir(), '.s');

export const S_CURRENT_HOME = path.join(process.cwd(), '.s');

export const S_CURRENT = path.join(process.cwd(), './');

export const S_ROOT_HOME_ACCESS = path.join(S_ROOT_HOME, 'access.yaml');

export const S_ROOT_HOME_COMPONENT = path.join(S_ROOT_HOME, 'components');
