import { loadComponent } from '../../src/common';

async function test() {
  // const fc = await loadComponent(
  //   '/Users/shihuali/learn/fc-atom/fc-ram-alibaba-component/dist/index.js',
  //   null,
  //   {
  //     a: 1,
  //   },
  // );
  // const fc = await loadApplication(
  //   'alibaba/fc@0.0.7',
  //   'https://tool.serverlessfans.com/api',
  //   // '../',
  //   '/Users/shihuali/workspace/s-core/packages/core',
  // );
  // const fc = await loadComponent('Serverless-Devs-Awesome/express-alibaba-component');
  // const fc = await loadApplication('Serverless-Devs/Serverless-Devs');
  // const fc = await loadComponent('Serverless-Devs-Awesome/express-alibaba-component','https://api.github.com/repos')

  // const fc = await loadApplication(
  //   'vue',
  //   'https://download.registry.serverlessfans.cn/init/alibaba-node.js12-http',
  // );

  // const fc = await loadApplication('devsapp/website-example:website-base');
  const fc = await loadComponent('devsapp/fc-deploy');
  console.log(fc);
}

test();
