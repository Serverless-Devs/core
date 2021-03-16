import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { providerArray, providerObject, providerCollection, checkProviderList } from '../constant';
import i18n from '../../../libs/i18n';

async function handleCustom(info: any) {
  const option = {
    type: 'list',
    name: 'name',
    message: 'Please select a type:',
    choices: [
      { name: i18n.__('Add key-value pairs'), value: 'add' },
      { name: i18n.__('End of adding key-value pairs'), value: 'over' },
    ],
  };
  const { name } = await inquirer.prompt(option);
  if (name === 'add') {
    const { key, value } = await inquirer.prompt([
      {
        type: 'input',
        message: i18n.__('Please enter key'),
        name: 'key',
      },
      {
        type: 'input',
        message: i18n.__('Please enter value'),
        name: 'value',
      },
    ]);
    info[key] = value;
    await handleCustom(info);
  }
}

function output({ selectedProvider, info, accessAlias }) {
  console.log('');
  console.info(`  Provider: ${providerObject[selectedProvider]} (${selectedProvider})`);
  if (accessAlias) {
    console.info(`    Alias: ${accessAlias}`);
  }
  Object.keys(info).forEach((item) => {
    console.info(`    ${item}: ${info[item]}`);
  });
  console.log('');
  console.info('Configuration successful');
}

async function writeData({ selectedProvider, info, accessAlias }) {
  let content: any;
  const filePath = path.join(os.homedir(), '.s/access.yaml');
  try {
    content = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    // error
  }
  const providerAlias = `${selectedProvider}.${accessAlias}`;
  if (content) {
    const providerAliasKeys = Object.keys(content);
    if (providerAliasKeys.includes(providerAlias)) {
      throw Error(
        `Provider + Alias already exists. You can set a different alias or modify it through: s config update -p ${selectedProvider} -a ${accessAlias}`,
      );
    } else {
      try {
        fs.appendFileSync(filePath, yaml.dump({ [providerAlias]: info }));
        output({ selectedProvider, info, accessAlias });
      } catch (err) {
        throw Error('Configuration failed');
      }
    }
  } else {
    try {
      fs.writeFileSync(filePath, yaml.dump({ [providerAlias]: info }));
      output({ selectedProvider, info, accessAlias });
    } catch (err) {
      throw Error('Configuration failed');
    }
  }
}

async function addAccess(provider?: string) {
  let selectedProvider: string;
  let info: any;
  if (!provider) {
    const answers: any = await inquirer.prompt(checkProviderList);
    selectedProvider = answers.provider;
  } else {
    selectedProvider = provider;
  }

  if (!providerArray.includes(selectedProvider)) {
    throw Error(
      `The cloud vendor[${selectedProvider}] was not found. [alibaba/aws/azure/baidu/google/huawei/tencent/custom]`,
    );
  }
  let accessAlias: string;
  const accessAliasObj = {
    type: 'input',
    message: 'Please create alias for key pair. If not, please enter to skip',
    name: 'aliasName',
    default: 'default',
  };
  if (selectedProvider === 'custom') {
    await handleCustom((info = {}));
    const res = await inquirer.prompt(accessAliasObj);
    accessAlias = res.aliasName;
  } else {
    const promptList = providerCollection[selectedProvider];
    promptList.push(accessAliasObj);
    info = await inquirer.prompt(promptList);
    Object.keys(info).forEach((item) => {
      if (item === 'aliasName') {
        accessAlias = info[item];
        delete info[item];
      }
    });
  }
  await writeData({ selectedProvider, info, accessAlias });
  return {
    Alias: accessAlias,
    ...info,
  };
}

export default addAccess;
