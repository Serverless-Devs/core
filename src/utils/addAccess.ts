/** @format */

const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const fs = require('fs');
const yaml = require('js-yaml');
import * as program from 'commander';
import {
  providerArray,
  providerObject,
  providerCollection,
  providerAccessFormat,
  checkProviderList,
} from './commonAccess';

function isEqualArray(rightFormat: string[], inputFormat: string[]): boolean {
  if (!(rightFormat || inputFormat)) {
    return false;
  }
  if (rightFormat.length !== inputFormat.length) {
    return false;
  }
  rightFormat.forEach(item => {
    if (!inputFormat.includes(item)) {
      return false;
    }
  });
  return true;
}

interface ConfigMap {
  [key: string]: any;
}

export class AddManager {
  globalFilePath: string;
  inputFullData: ConfigMap; // 用户输入的inputProviderAlias为键 与 inputSecretID 为值 组成的对象
  protected inputProviderAlias = '';
  protected inputSecretID: any;
  protected provider: string;
  aliasName: string;
  protected promptList: any[];
  protected isRightFormat = true;
  protected context: string[];
  constructor() {
    this.globalFilePath = path.join(os.homedir(), '.s/access.yaml');
    this.inputFullData = {};
    this.context = program.args;
  }

  async init(inputProviderAndAlisName: any, inputSecretCheck: any) {
    if (program.args.length > 0) {
      throw Error('Configuration failed');
    } else {
      if (inputProviderAndAlisName.Provider) {
        this.provider = String(inputProviderAndAlisName.Provider).toLocaleLowerCase();
        this.aliasName = String(inputProviderAndAlisName.AliasName || 'default').toLocaleLowerCase();
        if (providerArray.indexOf(this.provider) === -1) {
          throw Error(`The cloud vendor[${this.provider}] was not found. [alibaba/aws/azure/baidu/google/huawei/tencent]`);
        }

        this.inputSecretID = {};
        const inputSecretCheckKeys: string[] = Object.keys(inputSecretCheck); // 用户输入的秘钥对象的key

        //正确秘钥形式
        const providerAccessFormatSecret: string[] = providerAccessFormat[this.provider];
        //检查用户输入的秘钥的格式与对应云厂商的格式是否相同
        if (isEqualArray(providerAccessFormatSecret, inputSecretCheckKeys)) {
          for (const item of inputSecretCheckKeys) {
            this.inputSecretID[item] = inputSecretCheck[item];
          }
        } else {
          throw new Error(`Please Input Right Secret Format: [${providerAccessFormatSecret}]`);
        }
      } else {
        await this.inputLengthZero();
      }
    }

    await this.checkInputSecretID();
    this.inputProviderAlias = `${this.provider}.${this.aliasName || 'default'}`;
    this.inputFullData[this.inputProviderAlias] = this.inputSecretID;
    this.writeData(this.globalFilePath, this.inputFullData);
  }

  output() {
    console.log('');
    console.info(`  Provider: ${providerObject[this.provider]} (${this.provider})`);
    if (this.aliasName) {
      console.info(`    Alias: ${this.aliasName}`);
    }
    // eslint-disable-next-line guard-for-in
    for (const item in this.inputSecretID) {
      console.info(`    ${item}: ${this.inputSecretID[item]}`);
    }
    console.log('');
  }

  // 用户输入参数为0的时候
  async inputLengthZero(provider: any = undefined) {
    if (!provider) {
      {
        await inquirer.prompt(checkProviderList).then((answers: any) => {
          this.provider = answers.provider;
        });
      }
    } else {
      this.provider = provider.toLocaleLowerCase();
    }

    if (!providerArray.includes(this.provider)) {
      throw Error(`The cloud vendor[${this.provider}] was not found. [alibaba/aws/azure/baidu/google/huawei/tencent]`);
    }

    try {
      Object.keys(providerCollection).forEach(item => {
        if (item === this.provider) {
          this.promptList = providerCollection[item];
        }
      });
      this.promptList.push({
        type: 'input',
        message: 'Please create alias for key pair. If not, please enter to skip',
        name: 'aliasName',
        default: 'default', // 默认值
      });
    } catch (err) {
      throw Error(err.message);
    }
    await inquirer.prompt(this.promptList).then((answers: any) => {
      this.inputSecretID = answers;
    });

    Object.keys(this.inputSecretID).forEach(item => {
      if (item === 'aliasName') {
        this.aliasName = this.inputSecretID[item];
        delete this.inputSecretID[item];
      }
    });
    this.inputProviderAlias = this.provider + '.' + this.aliasName || 'default';
    return this.inputSecretID;
  }

  // 检查用户输入的输入的inputSecretID是否为空值
  async checkInputSecretID() {
    // eslint-disable-next-line guard-for-in
    for (const item in this.inputSecretID) {
      const isTrue: boolean = String(typeof this.inputSecretID[item]) === 'string';
      {
        if (!this.inputSecretID[item] || !isTrue) {
          throw Error(`The Provider[${providerObject[this.provider]}]: key[${item}] is required.`);
        }
      }
    }
  }

  async writeFileWay(filePath: string, text: ConfigMap) {
    this.output();
    try {
      await fs.writeFileSync(filePath, yaml.dump(text));
    } catch (err) {
      throw Error('Configuration failed');
    }
  }

  writeData(filePath: string, text: ConfigMap) {
    const isExists: boolean = fs.existsSync(filePath);
    // 当前文件不存在
    if (!isExists) {
      this.writeFileWay(filePath, text);
    } else {
      const userInformation: any = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
      // 文件存在，且不为空；
      // eslint-disable-next-line no-eq-null,eqeqeq
      if (userInformation != null) {
        const userProviderAlias: string[] = Object.keys(userInformation);
        const isExistProviderAlias: boolean = userProviderAlias.includes(this.inputProviderAlias);
        //全局配置是否含有用户输入的provider.alias
        if (isExistProviderAlias) {
          throw Error(`Provider + Alias already exists. You can set a different alias or modify it through: s config update -p ${this.provider} -a ${this.aliasName || 'default'}`);
        } else {
          try {
            fs.appendFileSync(filePath, yaml.dump(text));
            this.output();
            console.info('Configuration successful');
          } catch (err) {
            throw Error('Configuration failed');
          }
        }
      } else {
        this.writeFileWay(filePath, text);
      }
    }
  }
}
