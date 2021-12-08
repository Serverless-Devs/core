import { Logger } from '../../src/logger';
import inquirer from 'inquirer';

function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

(async () => {
  const logger = new Logger('S-CORE');

  let a = false
  await logger.task('test title111111', [
    {
      title: 'Checking git status',
      task: async () => {
        await sleep(1000)
        a = true
      },
    },
    {
      title: 'Checking remote history',
      task: async () => {
        if (a) {
          return
        }
        
        logger.spinner?.stop()
        await inquirer.prompt([{
          type: 'confirm',
          message: 'are you sure?',
          name: 'name'
        }])
        logger.spinner?.start()
        await sleep(5000)
      },
    },
    {
      title: 'Install package dependencies with Yarn',
      task: async () => {
        await sleep(1000)
      },
    },
  ]);

})();
