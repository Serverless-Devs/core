import {
  getGithubReleases,
  getGithubReleasesLatest,
  getServerlessReleases,
  getServerlessReleasesLatest,
} from './service';
import { RegistryEnum, RANDOM_PATTERN } from '../constant';
import path from 'path';
import downloadRequest from '../downloadRequest';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import chalk from 'chalk';
import _, { get, isEmpty, sortBy, includes, map, concat, replace, endsWith, keys } from 'lodash';
import rimraf from 'rimraf';
import installDependency from '../installDependency';
import {
  readJsonFile,
  getYamlContent,
  S_CURRENT,
  getSetConfig,
  isYamlFile,
  generateRandom,
} from '../../libs';
import { getCredentialAliasList, setCredential } from '../credential';
import { replaceFun, getYamlPath, getTemplatekey } from './utils';
import { execCommand } from '../execCommand';
import { logger, Logger } from '../../logger';
import parse from './parse';
import { tryfun } from '../../libs';
const gray = chalk.hex('#8c8d91');
const artTemplate = require('art-template');

interface IParams {
  source: string; // 组件名称
  registry?: string; // 源
  target?: string; // 下载目录路径
  name?: string; // 下载文件的命名
  parameters?: object; // s.yaml文件接收的入参
  appName?: string; // s.yaml文件里的项目名称
  access?: string; // s.yaml文件里的密钥
}

async function preInit({ temporaryPath, applicationPath }) {
  const hookPath = path.join(temporaryPath, 'hook');
  if (!fs.existsSync(hookPath)) return;
  try {
    const baseChildComponent = await require(hookPath);
    const tempObj = {
      tempPath: temporaryPath,
      targetPath: applicationPath,
      downloadRequest: downloadRequest,
      fse: fs,
      lodash: _,
      Logger,
      execCommand,
    };
    await baseChildComponent.preInit(tempObj);
  } catch (e) {
    logger.debug(`preInit error: ${e}`);
  }
}
class LoadApplication {
  private config: IParams;
  private temporaryPath: string;
  private spath: string;
  private secretList: string[] = [];
  constructor(config: IParams) {
    this.config = config;
  }
  async byUrl() {
    const { source, registry, target } = this.config;
    const applicationPath = path.resolve(target, source);
    await downloadRequest(registry, applicationPath, {
      extract: true,
    });
    return applicationPath;
  }
  async loadType() {
    const { registry } = this.config;
    if (registry === RegistryEnum.serverless || registry === RegistryEnum.serverlessOld) {
      return await this.loadServerless();
    }
    if (registry === RegistryEnum.github) {
      return await this.loadGithub();
    }
  }
  async loadServerless() {
    const source = this.config.source.includes('/')
      ? this.config.source
      : `./${this.config.source}`;
    const [provider, componentName] = source.split('/');
    if (!componentName) return;
    const [name, version] = componentName.split('@');
    let zipball_url: string;
    if (version) {
      const result = await tryfun(getServerlessReleases, provider, name);
      if (!result) return;
      const findObj = result.find((item) => item.tag_name === version);
      if (!findObj) return;
      zipball_url = findObj.zipball_url;
    } else {
      const result = await tryfun(getServerlessReleasesLatest, provider, name);
      if (!get(result, 'zipball_url')) return;
      zipball_url = result.zipball_url;
    }
    // 优先设置函数参数接收的name，如果没有在设置 source 里的 name
    const newName = this.config.name || name;
    const applicationPath = path.resolve(this.config.target, newName);
    return this.handleDecompressFile({
      zipball_url,
      applicationPath,
      name: newName,
    });
  }
  async loadGithub() {
    if (!this.config.source.includes('/')) return;
    const [user, componentName] = this.config.source.split('/');
    const [name, version] = componentName.split('@');
    let zipball_url: string;
    if (version) {
      const result = await tryfun(getGithubReleases, user, name);
      if (!result) return;
      const findObj = result.find((item) => item.tag_name === version);
      if (!findObj) return;
      zipball_url = findObj.zipball_url;
    } else {
      const result = await tryfun(getGithubReleasesLatest, user, name);
      if (!get(result, 'zipball_url')) return;
      zipball_url = result.zipball_url;
    }
    const newName = this.config.name || name;
    const applicationPath = path.join(this.config.target, newName);
    return this.handleDecompressFile({
      zipball_url,
      applicationPath,
      name: newName,
    });
  }
  async handleDecompressFile({ zipball_url, applicationPath, name }) {
    const answer = await this.checkFileExists(applicationPath, name);
    if (!answer) return applicationPath;
    const temporaryPath = `${applicationPath}${new Date().getTime()}`;
    this.temporaryPath = temporaryPath;
    await downloadRequest(zipball_url, temporaryPath, {
      extract: true,
      strip: 1,
    });
    await preInit({ temporaryPath, applicationPath });
    const publishYamlData = await getYamlContent(path.join(temporaryPath, 'publish.yaml'));
    let parameters = {};
    if (publishYamlData) {
      fs.copySync(`${temporaryPath}/src`, applicationPath);
      await this.initEnvConfig(applicationPath);
      parameters = this.config.parameters
        ? await this.initSconfigWithParam({ publishYamlData, applicationPath })
        : await this.initSconfig({ publishYamlData, applicationPath });
      await this.postInit({ temporaryPath, applicationPath, parameters });
      rimraf.sync(temporaryPath);
    } else {
      await this.postInit({ temporaryPath, applicationPath, parameters });
      fs.moveSync(`${temporaryPath}`, applicationPath);
    }
    await this.needInstallDependency(applicationPath);
    return applicationPath;
  }
  async postInit({ temporaryPath, applicationPath, parameters }) {
    const hookPath = path.join(temporaryPath, 'hook');
    let response: any = {};
    if (fs.existsSync(hookPath)) {
      try {
        const baseChildComponent = await require(hookPath);
        const tempObj = {
          tempPath: temporaryPath,
          targetPath: applicationPath,
          downloadRequest: downloadRequest,
          fse: fs,
          lodash: _,
          artTemplate: (filePath: string) => {
            const newPath = path.join(applicationPath, filePath);
            const newData = this.handleArtTemplate(newPath, parameters);
            fs.writeFileSync(newPath, newData, 'utf-8');
          },
          Logger,
          execCommand,
          parameters,
        };
        response = await baseChildComponent.postInit(tempObj);
      } catch (e) {
        logger.debug(`postInit error: ${e}`);
      }
    }
    // _custom_secret_list：postInit 里面的 secret 字段
    const { _custom_secret_list, ...rest } = response || {};
    const result = {
      ...parameters,
      ...rest,
      ..._custom_secret_list,
    };
    let newData = this.handleArtTemplate(this.spath, result);
    // art 语法需要先解析在验证yaml内容
    fs.writeFileSync(this.spath, newData, 'utf-8');
    // fix: Document with errors cannot be stringified
    await isYamlFile(this.spath);
    newData = parse({ appName: this.config.appName }, newData);
    fs.writeFileSync(this.spath, newData, 'utf-8');

    if (!isEmpty(_custom_secret_list)) {
      this.secretList = concat(this.secretList, keys(_custom_secret_list));
    }

    if (this.secretList.length > 0) {
      const dotEnvPath = path.join(applicationPath, '.env');
      fs.ensureFileSync(dotEnvPath);
      const str = map(this.secretList, (o) => `\n${o}=${result[o]}`).join('');
      fs.appendFileSync(dotEnvPath, str, 'utf-8');
    }
  }
  async needInstallDependency(cwd: string) {
    const packageInfo: any = readJsonFile(path.resolve(cwd, 'package.json'));
    if (!packageInfo || !get(packageInfo, 'autoInstall', true)) return;
    if (process.env.skipPrompt) {
      return await tryfun(installDependency, { cwd, production: false });
    }
    if (this.config.parameters) return true;
    const res = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to install dependencies?',
        default: true,
      },
    ]);
    if (res.confirm) {
      await tryfun(installDependency, { cwd, production: false });
    }
  }
  async initEnvConfig(appPath: string) {
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
  async initSconfig({ publishYamlData, applicationPath }) {
    const properties = get(publishYamlData, 'Parameters.properties');
    const requiredList = get(publishYamlData, 'Parameters.required');
    const promptList = [];
    if (properties) {
      let rangeList = [];
      for (const key in properties) {
        const ele = properties[key];
        ele['_key'] = key;
        rangeList.push(ele);
      }
      rangeList = sortBy(rangeList, (o) => o['x-range']);
      for (const item of rangeList) {
        const name = item._key;
        const prefix = item.description
          ? `${gray(item.description)}\n${chalk.green('?')}`
          : undefined;
        const validate = (input) => {
          if (isEmpty(input)) {
            return includes(requiredList, name) ? 'value cannot be empty.' : true;
          }
          if (item.pattern) {
            return new RegExp(item.pattern).test(input) ? true : item.description;
          }
          return true;
        };
        // 布尔类型
        if (item.type === 'boolean') {
          promptList.push({
            type: 'confirm',
            name,
            prefix,
            message: item.title,
            default: item.default,
          });
        } else if (item.type === 'secret') {
          this.secretList.push(name);
          // 密码类型
          promptList.push({
            type: 'password',
            name,
            prefix,
            message: item.title,
            default: item.default,
            validate,
          });
        } else if (item.enum) {
          // 枚举类型
          promptList.push({
            type: 'list',
            name,
            prefix,
            message: item.title,
            choices: item.enum,
            default: item.default,
          });
        } else if (item.type === 'string') {
          // 字符串类型
          promptList.push({
            type: 'input',
            message: item.title,
            name,
            prefix,
            default: endsWith(item.default, RANDOM_PATTERN)
              ? replace(item.default, RANDOM_PATTERN, generateRandom())
              : item.default,
            validate,
          });
        }
      }
    }
    this.spath = getYamlPath(applicationPath, 's');
    if (isEmpty(this.spath)) return;
    const credentialAliasList = map(await getCredentialAliasList(), (o) => ({
      name: o,
      value: o,
    }));
    let result: any = {};
    if (isEmpty(credentialAliasList)) {
      promptList.push({
        type: 'confirm',
        name: 'access',
        message: 'create credential?',
        default: true,
      });
      result = await inquirer.prompt(promptList);
      if (result?.access) {
        const data = await setCredential();
        result.access = data?.Alias;
      }
    } else {
      promptList.push({
        type: 'list',
        name: 'access',
        message: 'please select credential alias',
        choices: concat(credentialAliasList, {
          name: 'configure later.',
          value: false,
        }),
      });
      result = await inquirer.prompt(promptList);
    }

    if (result?.access === false) {
      result.access = '{{ access }}';
    }
    return result;
  }
  async initSconfigWithParam({ publishYamlData, applicationPath }) {
    this.spath = getYamlPath(applicationPath, 's');
    if (isEmpty(this.spath)) return;
    let result = this.config.parameters;
    const properties = get(publishYamlData, 'Parameters.properties');
    const requiredList = get(publishYamlData, 'Parameters.required', []);
    const newObj = {};
    if (properties) {
      for (const key in properties) {
        const ele = properties[key];
        if (result.hasOwnProperty(key)) {
          newObj[key] = result[key];
        } else if (ele.hasOwnProperty('default')) {
          newObj[key] = ele.default;
        } else if (includes(requiredList, key)) {
          throw new Error(`${key} parameter is required.`);
        }
      }
    }
    const accessObj = this.config.access ? { access: this.config.access } : {};
    return {
      ...newObj,
      ...accessObj,
    };
  }
  handleArtTemplate(templatePath, data) {
    artTemplate.defaults.extname = path.extname(templatePath);
    artTemplate.defaults.escape = false;
    const filterFilePath = path.join(this.temporaryPath, 'hook', 'filter.js');
    if (fs.existsSync(filterFilePath)) {
      const filterHook = require(filterFilePath);
      for (const key in filterHook) {
        artTemplate.defaults.imports[key] = filterHook[key];
      }
    }
    return artTemplate(templatePath, data);
  }
  async checkFileExists(filePath: string, fileName: string) {
    if (process.env.skipPrompt) return true;
    if (this.config.parameters) return true;
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
}

async function loadApplication(source: string, registry?: string, target?: string): Promise<string>;
async function loadApplication(params: IParams): Promise<string>;
async function loadApplication(
  oldsource: string | IParams,
  oldregistry?: string,
  oldtarget?: string,
) {
  const config = {} as IParams;
  if (typeof oldsource === 'string') {
    config.source = oldsource;
    config.registry = oldregistry;
    config.target = oldtarget || S_CURRENT;
  } else {
    config.source = oldsource.source;
    config.registry = oldsource.registry;
    config.target = oldsource.target || S_CURRENT;
    config.name = oldsource.name;
    config.parameters = oldsource.parameters;
    config.appName = oldsource.appName;
    config.access = oldsource.access;
  }

  const instance = new LoadApplication(config);

  if (config.registry) {
    if (config.registry !== RegistryEnum.github && config.registry !== RegistryEnum.serverless) {
      // 支持 自定义
      return await instance.byUrl();
    }
  }
  let appPath: string;
  if (config.registry) {
    appPath = await instance.loadType();
    if (appPath) return appPath;
  }
  const registryFromSetConfig = await getSetConfig('registry');
  if (registryFromSetConfig) {
    appPath = await instance.loadType();
    if (appPath) return appPath;
  }
  appPath = await instance.loadServerless();
  if (appPath) return appPath;
  appPath = await instance.loadGithub();
  if (appPath) return appPath;

  if (!appPath) {
    throw new Error(
      JSON.stringify({
        message: `No ${config.source} app found.`,
        tips: 'Please make sure the app name or source is correct, you can get applications on Serverless Regsitry: https://registry.serverless-devs.com',
      }),
    );
  }
}

export default loadApplication;
