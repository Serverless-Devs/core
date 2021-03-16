import inquirer from 'inquirer';
import getAccess from './getAccess';
import addAccess from './addAccess';

async function setCredential(provider?: string) {
  const accessContent = getAccess(provider);
  const choices = [];
  Object.keys(accessContent).forEach((item) => {
    const [start, end] = item.split('.');
    const temp = {
      name: `${start}: ${end}`,
      value: item,
    };
    choices.push(temp);
  });
  choices.push({ name: 'Create a new account', value: 'create' });

  const { access } = await inquirer.prompt([
    {
      type: 'list',
      name: 'access',
      message: 'Please select an access:',
      choices,
    },
  ]);
  if (access === 'create') {
    return addAccess(provider);
  }
  const [, Alias] = access.split('.');
  return {
    Alias,
    ...accessContent[access],
  };
}

export default setCredential;
