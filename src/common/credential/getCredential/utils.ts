import { jsonparse } from '../../../libs/utils';

export function transformInputs(inputs, result) {
  if (!inputs || !result) return;
  const { Alias } = result;
  inputs.project = { ...inputs.project, access: Alias };
  inputs.Project = { ...inputs.Project, accessAlias: Alias, AccessAlias: Alias };
  inputs.credentials = result;
  inputs.Credentials = result;
}

export function trim(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/(^\s*)|(\s*$)/g, '');
    }
  }
  return obj;
}

export function getServerlessDevsAccessFromEnv() {
  for (const key in process.env) {
    if (key.endsWith('serverless_devs_access')) return jsonparse(process.env[key]);
  }
}
