import { loadApplication } from '../../src/common';

async function test() {
  // const fc = await loadComponent(
  //   '/Users/shihuali/.s/components/serverlessfans.com/alibaba/fc@0.1.2',
  // );
  // const fc = await loadApplication(
  //   'alibaba/fc@0.0.7',
  //   'https://tool.serverlessfans.com/api',
  //   // '../',
  //   '/Users/shihuali/workspace/s-core/packages/core',
  // );
  // const fc = await loadComponent('Serverless-Devs-Awesome/express-alibaba-component');
  // const fc = await loadComponent('Serverless-Devs/Serverless-Devs');
  // const fc = await loadComponent('Serverless-Devs-Awesome/express-alibaba-component','https://api.github.com/repos')

  const fc = await loadApplication('Serverless-Devs/Serverless-Devs@1.1.13');
  console.log(fc);
}

test();
