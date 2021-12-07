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

function parse(key: string) {
  try {
    const params = JSON.parse(process.env[key]);
    return Object.keys(params).length > 0 ? params : undefined;
  } catch (error) {}
}

export function getServerlessDevsAccessFromEnv(access?: string) {
  if (access) {
    const data = parse(access);
    return data
      ? {
          Alias: access,
          ...parse(access),
        }
      : undefined;
  }
  for (const key in process.env) {
    if (key.endsWith('serverless_devs_access')) {
      return {
        Alias: key,
        ...parse(key),
      };
    }
  }
}
