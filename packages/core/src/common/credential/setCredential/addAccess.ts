import inquirer from 'inquirer';
import { providerArray, providerCollection, checkProviderList } from './constant';
// import i18n from '../../../libs/i18n';

// async function handleCustom() {
//   const option = {
//     type: 'list',
//     name: 'name',
//     message: 'Please select a type:',
//     choices: [
//       { name: i18n.__('Add key-value pairs'), value: 'add' },
//       { name: i18n.__('End of adding key-value pairs'), value: 'over' },
//     ],
//   };
//   const { name } = await inquirer.prompt(option);
//   if (name === 'add') {
//     const { key, value } = await inquirer.prompt([
//       {
//         type: 'input',
//         message: i18n.__('Please enter key'),
//         name: 'key',
//       },
//       {
//         type: 'input',
//         message: i18n.__('Please enter value'),
//         name: 'value',
//       },
//     ]);
//     this.inputSecretID[key] = value;
//     await handleCustom();
//   }
// }

async function addAccess(provider?: string) {
  let selectedProvider: string;
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
    // await handleCustom();
    const res = await inquirer.prompt(accessAliasObj);
    accessAlias = res.aliasName;
  } else {
    const promptList = providerCollection[selectedProvider];
    promptList.push(accessAliasObj);
    console.log(await inquirer.prompt(promptList));

    // Object.keys(this.inputSecretID).forEach((item) => {
    //   if (item === 'aliasName') {
    //     this.aliasName = this.inputSecretID[item];
    //     delete this.inputSecretID[item];
    //   }
    // });
  }
  console.log(accessAlias);
}

export default addAccess;
