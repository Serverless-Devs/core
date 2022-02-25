import {
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import { RegistryEnum } from '../constant';
import path from 'path';
import downloadRequest from '../downloadRequest';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { get, isEmpty } from 'lodash';
import rimraf from 'rimraf';
import installDependency from '../installDependency';
import {
  readJsonFile,
  getServerlessDevsTempArgv,
  getYamlContent,
  S_CURRENT,
  getSetConfig,
} from '../../libs';
import { getCredentialAliasList } from '../credential';
import { replaceFun, getYamlPath, getTemplatekey } from './utils';

interface IParams {
  source: string;
  registry?: string;
  target?: string;
  name?: string;
}

async function tryfun(f: Promise<any>) {
  try {
    return await f;
  } catch (error) {
    // ignore error, 不抛出错误，需要寻找不同的源
  }
}

async function preInit({ temporaryPath, applicationPath }) {
  try {
    const baseChildComponent = await require(path.join(temporaryPath, 'hook'));
    const tempObj = {
      tempPath: temporaryPath,
      targetPath: applicationPath,
    };
    await baseChildComponent.preInit(tempObj);
  } catch (e) {}
}

async function postInit({ temporaryPath, applicationPath }) {
  try {
    const baseChildComponent = await require(path.join(temporaryPath, 'hook'));
    const tempObj = {
      tempPath: temporaryPath,
      targetPath: applicationPath,
    };
    await baseChildComponent.postInit(tempObj);
  } catch (e) {}
}

async function loadServerless(params: IParams) {
  const source = params.source.includes('/') ? params.source : `./${params.source}`;
  const [provider, componentName] = source.split('/');
  if (!componentName) return;
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getServerlessReleases(provider, name));
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getServerlessReleasesLatest(provider, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
  }
  // 优先设置函数参数接收的name，如果没有在设置 source 里的 name
  const applicationPath = path.resolve(params.target, params.name || name);
  return handleDecompressFile({ zipball_url, applicationPath, name: params.name || name });
}

async function loadGithub(params: IParams) {
  if (!params.source.includes('/')) return;
  const [user, componentName] = params.source.split('/');
  const [name, version] = componentName.split('@');
  let zipball_url: string;
  if (version) {
    const result = await tryfun(getGithubReleases(user, name));
    if (!result) return;
    const findObj = result.find((item) => item.tag_name === version);
    if (!findObj) return;
    zipball_url = findObj.zipball_url;
  } else {
    const result = await tryfun(getGithubReleasesLatest(user, name));
    if (!get(result, 'zipball_url')) return;
    zipball_url = result.zipball_url;
  }
  const applicationPath = path.resolve(params.target, params.name || name);
  return handleDecompressFile({ zipball_url, applicationPath, name: params.name || name });
}
async function handleDecompressFile({ zipball_url, applicationPath, name }) {
  const answer = await checkFileExists(applicationPath, name);
  if (!answer) return applicationPath;
  const temporaryPath = `${applicationPath}${new Date().getTime()}`;
  await downloadRequest(zipball_url, temporaryPath, {
    extract: true,
    strip: 1,
  });
  preInit({ temporaryPath, applicationPath });
  const publishYamlData = await getYamlContent(path.resolve(temporaryPath, 'publish.yaml'));
  if (publishYamlData) {
    fs.copySync(`${temporaryPath}/src`, applicationPath);
    rimraf.sync(temporaryPath);
    await initSconfig({ publishYamlData, applicationPath });
    await initEnvConfig(applicationPath);
  } else {
    fs.moveSync(`${temporaryPath}`, applicationPath);
  }
  await needInstallDependency(applicationPath);
  postInit({ temporaryPath, applicationPath });
  return applicationPath;
}

async function initEnvConfig(appPath: string) {
  const envExampleFilePath = path.resolve(appPath, '.env.example');
  if (!fs.existsSync(envExampleFilePath)) return;
  const envConfig = fs.readFileSync(envExampleFilePath, 'utf-8');
  const templateKeys = getTemplatekey(envConfig);
  if (templateKeys.length === 0) return;
  const promptOption = templateKeys.map((item) => {
    const { name, desc } = item;
    return {
      type: 'input',
      message: `please input ${desc || name}:`,
      name,
    };
  });
  const result = await inquirer.prompt(promptOption);
  const newEnvConfig = replaceFun(envConfig, result);
  fs.unlink(envExampleFilePath);
  fs.writeFileSync(path.resolve(appPath, '.env'), newEnvConfig, 'utf-8');
}

async function initSconfig({ publishYamlData, applicationPath }) {
  const properties = get(publishYamlData, 'Parameters.properties');
  const requiredList = get(publishYamlData, 'Parameters.required');
  const promptList = [];
  if (properties) {
    for (const key in properties) {
      const ele = properties[key];
      if (ele.enum) {
        promptList.push({
          type: 'list',
          name: key,
          message: ele.description,
          choices: ele.enum,
          default: ele.default,
        });
      } else if (ele.type === 'string') {
        promptList.push({
          type: 'input',
          message: ele.description,
          name: key,
          default: ele.default,
          validate(input) {
            if (requiredList.includes(key)) {
              return input.length > 0 ? true : 'value cannot be empty.';
            }
            return true;
          },
        });
      }
    }
  }
  const credentialAliasList = await getCredentialAliasList();
  const obj = isEmpty(credentialAliasList)
    ? {
        type: 'confirm',
        name: 'access',
        message: 'create credential?',
        default: true,
      }
    : {
        type: 'list',
        name: 'access',
        message: 'please select credential alias',
        choices: credentialAliasList,
      };
  promptList.push(obj);
  const result = await inquirer.prompt(promptList);
  const spath = getYamlPath(applicationPath, 's');
  const sYamlData = fs.readFileSync(spath, 'utf-8');
  fs.writeFileSync(spath, replaceFun(sYamlData, result), 'utf-8');
}

async function needInstallDependency(cwd: string) {
  const packageInfo: any = readJsonFile(path.resolve(cwd, 'package.json'));
  if (!packageInfo || !get(packageInfo, 'autoInstall', true)) return;
  if (process.env.skipPrompt) {
    return await tryfun(installDependency({ cwd, production: false }));
  }
  const tempArgv = getServerlessDevsTempArgv();
  if (tempArgv['force-creation']) return true;
  const res = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to install dependencies?',
      default: true,
    },
  ]);
  if (res.confirm) {
    await tryfun(installDependency({ cwd, production: false }));
  }
}

async function checkFileExists(filePath: string, fileName: string) {
  if (process.env.skipPrompt) return true;
  const tempArgv = getServerlessDevsTempArgv();
  if (tempArgv['force-creation']) return true;
  if (fs.existsSync(filePath)) {
    const res = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `File ${fileName} already exists, override this file ?`,
        default: true,
      },
    ]);
    return res.confirm;
  }
  // 不存在文件，返回true表示需要覆盖
  return true;
}

async function loadType(params: IParams) {
  if (
    params.registry === RegistryEnum.serverless ||
    params.registry === RegistryEnum.serverlessOld
  ) {
    return await loadServerless(params);
  }
  if (params.registry === RegistryEnum.github) {
    return await loadGithub(params);
  }
}

async function loadApplicationByUrl({ source, registry, target }: IParams) {
  const applicationPath = path.resolve(target, source);
  await downloadRequest(registry, applicationPath, {
    extract: true,
  });
  return applicationPath;
}

async function loadApplication(source: string, registry?: string, target?: string): Promise<string>;
async function loadApplication(params: IParams): Promise<string>;
async function loadApplication(
  oldsource: string | IParams,
  oldregistry?: string,
  oldtarget?: string,
) {
  let source: any;
  let registry: string;
  let target: string;
  let name: string;
  if (typeof oldsource === 'string') {
    source = oldsource;
    registry = oldregistry;
    target = oldtarget || S_CURRENT;
  } else {
    source = oldsource.source;
    registry = oldsource.registry;
    target = oldsource.target || S_CURRENT;
    name = oldsource.name;
  }

  if (registry) {
    if (registry !== RegistryEnum.github && registry !== RegistryEnum.serverless) {
      // 支持 自定义
      return await loadApplicationByUrl({ source, registry, target });
    }
  }
  let appPath: string;
  if (registry) {
    appPath = await loadType({ source, registry, target, name });
    if (appPath) return appPath;
  }
  const registryFromSetConfig = await getSetConfig('registry');
  if (registryFromSetConfig) {
    appPath = await loadType({ source, registry: registryFromSetConfig, target, name });
    if (appPath) return appPath;
  }
  appPath = await loadServerless({ source, target, name });
  if (appPath) return appPath;
  appPath = await loadGithub({ source, target, name });
  if (appPath) return appPath;

  if (!appPath) {
    throw new Error(`No ${source} app found, please make sure the app name or source is correct`);
  }
}

export default loadApplication;
