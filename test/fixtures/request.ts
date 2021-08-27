import { downloadRequest } from '../../src/common';

// async function test() {
//   const result = await request('http://domain.devsapp.cn/token', {
//     method: 'post',
//     body: {
//       type: 'fc',
//       user: '1899690531354629',
//       region: 'cn-shenzhen',
//       service: 'Authing',
//       function: 'Authing',
//     },
//     form: true,
//   });
//   console.log(result);
// }

// test();

async function test() {
  await downloadRequest('https://registry.devsapp.cn/simple/devsapp/website/zipball/0.0.43', './a', {extract:true, filename:'xx.zip'});
}

test()