// import { request } from '../../lib';
// import got from 'got';

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

// async function test() {
//   const result = await request('https://api.github.com/repos/devsapp/fc-deploy/releases/latest');
//   console.log(result.zipball_url);
// }

// setInterval(() => {
//   test();
// }, 500);


// async function getContentLength() {
//   try {
//     const { headers } = await got('https://registry.devsapp.cn/simple/devsapp/fc-common/zipball/0.0.2', {
//       method: 'HEAD',
//       timeout: {
//         request: 6
//       }
//     });
//     return parseInt(headers['content-length'], 10);
//   } catch (error) {
//     return 0;
//   }
// }

// async function getLentest() {
//   const len = await getContentLength();
//   console.log(len);
// }
// getLentest();

// import { downloadRequest } from '../../src';

// downloadRequest(
//     // 'https://registry.devsapp.cn/simple/devsapp/image-prediction-app/zipball/0.0.6',
//     'https://registry.devsapp.cn/simple/devsapp/core/zipball/dev',
//     '/Users/shihuali/workspace/core/test/fixtures/a',
//     {
//         extract: true,
//         strip: 1,
//     })

import { request } from '../../src';

const HINT = {
    loading: 'Get token....',
    success: 'End of request',
    error: 'Request failed',
  };

const body ={
    "type": "fc",
    "user": "1694024725952210",
    "region": "cn-beijing",
    "service": "web-framework1",
    "function": "express"
}

request('http://domain.devsapp.net/token', {
    method: 'post',
    body,
    form: true,
    hint: HINT,
}).then(res=>{
    console.log(res);
    
})

