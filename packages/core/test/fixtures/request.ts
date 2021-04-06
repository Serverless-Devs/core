import { request } from '../../src/common';

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
  const result = await request(
    'https://api.github.com/repos/Serverless-Devs/Serverless-Devs/releases/latest',
  );
  console.log(result.zipball_url);
}

test();
