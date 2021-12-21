import { Logger } from '../../src/logger';
// import inquirer from 'inquirer';

// function sleep(timer: number) {
//   return new Promise((resolve) => {
//     setTimeout(() => resolve(true), timer);
//   });
// }

(async () => {
  const logger = new Logger('S-CORE');
  logger.output({
    dankun: {
      name:'aaa',
      age: 200,
      sex: true,
      man: false
    }
  })

  // let a = false
  // await logger.task('test title111111', [
  //   {
  //     title: 'Checking git status',
  //     task: async () => {
  //       await sleep(1000)
  //       a = true
  //     },
  //   },
  //   {
  //     title: 'Checking remote history',
  //     enabled(){
  //       return a
  //     },
  //     task: async () => {
  //       throw new Error('my error')
  //       logger.spinner?.stop()
  //       await inquirer.prompt([{
  //         type: 'confirm',
  //         message: 'are you sure?',
  //         name: 'name'
  //       }])
  //       logger.spinner?.start()
  //       await sleep(5000)
  //     },
  //   },
  //   {
  //     title: 'Install package dependencies with Yarn',
  //     task: async () => {
  //       await sleep(1000)
  //     },
  //   },
  // ]);

})();
