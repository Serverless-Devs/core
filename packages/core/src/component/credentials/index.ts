import inquirer from 'inquirer';
import AddManager from './add-access.service';
import getAccess from './get-access.service';
import path from 'path';
import os from 'os';

export default async function credential(inputs: any) {
  const Provider = inputs.Project?.Provider || inputs.project?.provider;
  const providerMap = getAccess({ Provider });

  // 选择
  const selectObject = [];
  Object.keys(providerMap).forEach((item) => {
    const temp = {
      name: item.startsWith('project')
        ? `${item.replace('project.', 'project: ')}`
        : `${item.replace(`${Provider}.`, `${Provider}: `)}`,
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

  selectObject.push({ name: 'Create a new account', value: 'create' });
  let access = '';
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
      access = answers.access;
    });
  if (access === 'create') {
    const addManager = new AddManager();
    const result = await addManager.inputLengthZero(Provider);
    const inputProviderAlias = `${addManager.provider}.${addManager.aliasName || 'default'}`;
    addManager.writeData(path.join(os.homedir(), '.s/access.yaml'), {
      [inputProviderAlias]: result,
    });
    return result;
  }
  return providerMap[access];
}
