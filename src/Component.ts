
const util = require('util');
const path = require('path');
const fs = require('fs');
const { packTo } = require('@serverless-devs/s-zip');
const exec = util.promisify(require('child_process').exec);
import Context from './Context';
const inquirer = require('inquirer');
import { GetManager } from './utils/getAccess';
import { AddManager } from './utils/addAccess';
import { downComponent, getRemoteComponentVersion } from './utils';
interface ComponentContext {
  instance: Context
  log?: (msg: string) => void
  status?: (msg: string) => void
  output?: (msg: string) => void
  sleep?: (msg: string) => void
  args2Json?: (msg: string) => void
}
export default class Component {
  protected id: string;
  protected context: ComponentContext;
  protected state = {};
  public name: string
  constructor(id?: string, context?: Context) {
    this.id = id || this.constructor.name;
    if (!context) {
      context = new Context();
    }
    this.name = `instance_${Date.now()}`;
    this.context = {
      instance: context
    };
  }

  async init() {
    await this.context.instance.init();
    this.state = await this.context.instance.getState(this.id);
  }

  async save() {
    const { id, state } = this;
    await this.context.instance.setState(id, state);
  }

  sleep(ms: any) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async credentials(inputs: any){
    if(Object.keys(inputs.Credentials).length > 0){
      return inputs.Credentials
    }

    const Provider = inputs.Project.Provider || "Alibaba"
    const configUserInput = {
      Provider: Provider
    }

    const getManager = new GetManager();
    await getManager.initAccessData(configUserInput);
    const providerMap: {
      [key: string]: any;
    } = await getManager.getUserSecretID(configUserInput);

    let result = '';
    // 选择
    const selectObject = [];
    Object.keys(providerMap).forEach(item => {
      const temp = {
        name: item.startsWith('project')
          ? `${item.replace('project.', 'project: ')}`
          : `${item.replace(Provider + '.', Provider + ': ')}`,
        value: item,
      };
      if (Provider) {
        if (item.startsWith(Provider) || item.startsWith('project')) {
          selectObject.push(temp);
        }
      } else {
        selectObject.push(temp);
      }
    });

    selectObject.push({name: 'Create a new account', value: 'create'});
    await inquirer
      .prompt([
        {
          type: 'list',
          name: 'access',
          message: 'Please select an access:',
          choices: selectObject,
        },
      ])
      .then((answers: any) => {
        result = answers.access;
      });
    if (result === 'create') {
        const addManager = new AddManager();
        const result = await addManager.inputLengthZero(Provider);

        // 2020-9-23 修复部署过程中增加密钥信息，无法存储到系统的bug
        const inputProviderAlias = `${Provider}.${addManager.aliasName || 'default'}`;
        addManager.inputFullData[inputProviderAlias] = result;
        addManager.writeData(addManager.globalFilePath, addManager.inputFullData);

        return result;
    }
    return providerMap[result];
  }



  private getNewKey(key: any) {
    try {
      const tempKey = key.split('-');
      let resultKey = '';
      for (let i = 0;i < tempKey.length;i++) {
        if (i === 0) {
          resultKey = tempKey[0];
        } else {
          resultKey = resultKey + tempKey[i][0].toUpperCase() + tempKey[i].slice(1, tempKey[i].length);
        }
      }
      return resultKey;
    } catch (ex) {
      return key;
    }
  }

  args(args: any, boolList?:[], moreList?:[], argsList?:[]) {
    /*
     *  变更：
     *     1. 二级指令增加转换，例如a-b变成aB
     *     2. 主Key增加转换，例如a-b变成aB
     */
    const argsData: any = {};
    const commandData: any = [];
    const argsStatus = argsList === undefined ? true : false;
    boolList = boolList || [];
    moreList = moreList || [];
    argsList = argsList || [];
    args = args || '';
    if (args) {
      const tempList = args.split(' ');
      let temp: any;
      let sourceTemp: any;
      let listTemp: any;
      let indexTemp: any;
      for (let i = 0; i < tempList.length; i++) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (tempList[i].startsWith('-') && (argsStatus || argsList.indexOf(tempList[i]) >= 0)) {
          // eslint-disable-next-line no-unused-vars
          indexTemp = i;
          let tempArgs = tempList[i].startsWith('--')
            ? tempList[i].slice(2, tempList[i].length)
            : tempList[i].slice(1, tempList[i].length);
          tempArgs = this.getNewKey(tempArgs);
          if (argsData.hasOwnProperty(tempArgs)) {
            listTemp = tempArgs;
          } else {
            argsData[tempArgs] = undefined;
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          temp = boolList.indexOf(tempArgs) !== -1 ? undefined : tempArgs;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          sourceTemp = boolList.indexOf(tempArgs) !== -1 ? undefined : tempList[i];
        } else {
          if (temp) {
            if (temp === listTemp) {
              // 此时是传入了list数组
              if (i - indexTemp > 1) {
                const tempStrIndex = argsData[temp].length - 1;
                argsData[temp][tempStrIndex] = (argsData[temp][tempStrIndex] ? argsData[temp][tempStrIndex] + ' ' : '') + tempList[i];
              } else {
                if (!(argsData[temp] instanceof Array)) {
                  argsData[temp] = [argsData[temp]];
                }
                argsData[temp].push(tempList[i]);
              }
            } else {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              if (moreList.indexOf(temp) !== -1 || argsList.indexOf(sourceTemp) !== -1) {
                argsData[temp] = (argsData[temp] ? argsData[temp] + ' ' : '') + tempList[i];
              } else {
                if (argsData[temp]) {
                  commandData.push(tempList[i]);
                } else {
                  argsData[temp] = tempList[i];
                }
              }
            }
          } else {
            // 修复非-/--开头的变成驼峰格式
            commandData.push(tempList[i]);
          }
        }
      }
    }
    for (let eveItem in argsData) {
      if (argsData[eveItem] === undefined) {
        argsData[eveItem] = true;
      }
    }
    return {
      'Commands': commandData,
      'Parameters': argsData
    };
  }

  help(inputs: any, message: any) {
    try {
      const tempList = inputs.Args.split(' ');
      if (tempList.includes('--help') || tempList.includes('-h')) {
        console.log(`\n    ${message.description}\n`);
        if (message.commands && message.commands.length > 0) {
          console.log(`\n  Commands: `);
          for (let i = 0;i < message.commands.length;i++) {
            if (message.commands[i].name && message.commands[i].desc) {
              console.log(`      ${message.commands[i].name}: ${message.commands[i].desc}`);
            }
          }

        }
        if (message.args && message.args.length > 0) {
          console.log(`\n  Args: `);
          for (let i = 0;i < message.args.length;i++) {
            if (message.args[i].name && message.args[i].desc) {
              console.log(`      ${message.args[i].name}: ${message.args[i].desc}`);
            }
          }
        }
        console.log('\n');
        process.exit(0);
      }
    } catch (ex) {}
  }

  async zip(packToParame: any) {
    try {
      return await packTo(packToParame);
    } catch (err) {
      throw new Error(err);
    }

  }

  async load(componentName: any, componentAlias = '', provider = 'alibaba' ) {
    let externalComponentPath;

    const version = await getRemoteComponentVersion({
      name: componentName,
      provider: provider,
      type: 'component'});

    const tempPath = `./${componentName}-${provider}@${version}`;

    if (this.context.instance.componentPathRoot) { // s component
      externalComponentPath = path.resolve(this.context.instance.componentPathRoot, tempPath, 'index.js');
    } else {
      externalComponentPath = path.resolve(componentName);
    }

    if (!fs.existsSync(externalComponentPath)) {
      await downComponent(componentName, provider, path.join(this.context.instance.componentPathRoot, tempPath));
      // 判断是否需要安装依赖
      const basePath = path.join(this.context.instance.componentPathRoot, tempPath)
      const havePackageJson = fs.existsSync(path.join(basePath, 'package.json'))
      const haveNodeModules = fs.existsSync(path.join(basePath, 'node_modules'))

      console.log('Installing dependencies in serverless-devs core ...');

      if (havePackageJson && !haveNodeModules) {
        const {stdout, stderr} = await exec('npm install --registry=https://registry.npm.taobao.org', {
          cwd: basePath,
        });
        if (stderr) {
          console.error(stderr);
        } else {
          console.log(stdout);
        }
      }

    }
    const childComponent = await require(externalComponentPath);

    const childComponentId = `${this.id}.${componentAlias || childComponent.name}`;

    const childComponentInstance = new childComponent(childComponentId, this.context.instance);

    if (childComponentInstance instanceof Component) {
      await childComponentInstance.init();
      childComponentInstance.context.status = () => { };
    } else if (childComponentInstance.init) {
      await childComponentInstance.init();
    }

    return childComponentInstance;
  }
}

