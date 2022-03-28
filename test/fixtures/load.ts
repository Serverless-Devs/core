// @ts-ignore
import { loadComponent, loadApplication } from '../../src';

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
  //   'https://download.registry.devsapp.cn/init/alibaba-node.js12-http',
  // );

  // const fc = await loadApplication('devsapp/website-example:website-base');
  // devsapp/start-malagu
  // devsapp/website-example:website-base
  // devsapp/midway-hook-react
  // devsapp/midway-hook-example:midway-hook-react
  // website-base
  // devsapp/website-base
  // devsapp/website-example:website-base
  const fc = await loadApplication({
    source:'devsapp/start-django',
    target: './',
    name: 'newxx',
    parameters: {"functionName":"django","region":"cn-hangzhou","serviceName":"web-framework"},
    appName: 'myx',
    access: 'sub',
  });
  // const fc = await loadComponent('xsahxl/xsahxl.github.io@0.0.1');
  // const fc = await loadComponent('devsapp/springboot');
  // process.env.skipPrompt = 'true';
  // process.env.core_load_serverless_devs_component = 'devsapp/fc-info@dev;xsahxl/fc-deploy@0.0.55'
  // const fc = await loadComponent('devsapp/fc');
  console.log(fc);
}

test();
