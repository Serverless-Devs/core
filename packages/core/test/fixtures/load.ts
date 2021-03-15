import { loadComponent } from '../../src/common';

async function test() {
  // const [FC] = await loadComponent('alibaba/fc', 'https://tool.serverlessfans.com/api');

  // const [FC] = await loadComponent('Serverless-Devs/Serverless-Devs@1.1.13');
  const [FC] = await loadComponent('Serverless-Devs/Serverless-Devs');
  console.log(FC);
}

test();

// loadComponent('Serverless-Devs/Serverless-Devs').then((res) => {
//   console.log('res', res);
// });

// loadApplication('Serverless-Devs/Serverless-Devs');

// import { downloadRequest } from '../../src/common';

// downloadRequest(
//   'https://api.github.com/repos/Serverless-Devs/Serverless-Devs/zipball/1.1.13',
//   //   'https://serverless-tool.oss-cn-hangzhou.aliyuncs.com/others/pulumi-alibaba-component/pulumi-v2.19.0-darwin-x64.tar.gz?versionId=CAEQFRiBgMD7hsDAuxciIDczZWRiZjI4NzVlNjRkMjc4MjA0MDE4YWM0MTc0Mjli',
//   './demo',
//   //   { extract: true, strip: 1 },
// );
