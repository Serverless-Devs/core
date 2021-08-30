## request

#### HTTP 请求， 用于统一网络请求，支持 loading 效果

- get, `method` 默认 `get` 请求, 通过 `params` 传递参数

```typescript
const { request } = require('@serverless-devs/core');

request(url, {
  params: {
    key: 'value',
  },
});
```

- post，通过 `body` 传递参数， 默认 json 数据，如果需要传递 form-data，可传递参数 form 为 true 即可

```typescript
const { request } = require('@serverless-devs/core');

request(url, {
  method: 'post'
  body: {
    key: 'value',
  },
  // form: true
});

```

- 如果希望不抛出错误信息，可通过 `ignoreError` 参数设置为 `true` 即可

```typescript
const { request } = require('@serverless-devs/core');

request(url, {
  method: 'post'
  body: {
    key: 'value',
  },
  // ignoreError: true
});

```

```typescript
const { request } = require('@serverless-devs/core');

function test_request_hint() {
  request('https://api.github.com/users/octocat', {
    params: {
      tag: 'fc',
      error: 'error',
    },
    hint: {
      loading: '数据请求中...',
      success: '数据请求成功',
      error: '数据请求失败',
    },
  });
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01KZM5eM22LDuoZY3ZB_!!6000000007103-1-tps-1312-73.gif)

## downloadRequest

#### 用于统一下载的方法，会自动带上下载进度条

```typescript
/**
 * url: 远程下载的链接
 * outDir: 下载存放的路径
 * {
 *  extract: true // 是否执行解压操作
 *  strip: 1 // 文件提取目录级别
 * }
 */
downloadRequest(url, outDir, { extract: true, strip: 1 });
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01LukqOH1bJr6l77VGk_!!6000000003445-1-tps-1312-200.gif)

## report

#### 组件上报

```typescript
const { reportComponent, HLogger, ILogger } = require('@serverless-devs/core');

class ReportDemo {
  @HLogger('S-CORE') logger: ILogger;
  async component() {
    await reportComponent('website', {
      command: 'deploy',
      uid: '123435',
      remark: 'test',
    });
    this.logger.info('成功上报');
  }
}
```

## loadComponent

#### `loadComponent` 方法是 `load` 方法的`别名`，用于加载组件，组件会下载到 ~/.s/components 目录下面。

- loadComponent(source: string, registry?: Registry, params: any)

```typescript
/**
 * source 传参数格式说明
 * 1.serverless hub 源为 `<org名>/<组件名>` 会下载最新版本，`<org名>/<组件名>@<组件版本号>` 会下载指定版本
 * serverless hub官方的org名默认为devsapp，
 * 2.github 源为 `<org名>/<项目名称>` 会下载最新版本，`<org名>/<项目名称>@<项目发布的版本号>` 会下载指定版本
 * 3.支持本地调试，可传本地组件的当前路径
 *
 * registry 参数说明，值为 'http://registry.devsapp.cn/simple' 或者 'https://api.github.com/repos'
 * 优先读取方法传入的参数 registry，如果找不到，然后读取 ~/.s/components/set-config.yml 文件里的 registry
 * 如果找不到，优先读取 serverless hub 源，如果找不到，最后读取 github 源
 * params 参数说明，方法内部在require组件的时候会new一次，params会在new的时候透传给组件
 *
 * /
```

```typescript
const { loadComponent } = require('@serverless-devs/core');
loadComponent('devsapp/fc-deploy');
```

- 支持下载特定版本的组件

```typescript
const { loadComponent } = require('@serverless-devs/core');
loadComponent('devsapp/fc-deploy@0.1.2');
```

- 支持加载本地组件

```typescript
const { loadComponent } = require('@serverless-devs/core');
loadComponent('/Users/shihuali/.s/components/serverlessfans.com/alibaba/fc@0.1.2');
```

## loadApplication

#### 用于加载应用，支持下载到指定目录，如果不指定，则默认会下载到当前目录

- loadApplication(source: string, registry?: string, target?:string)

```typescript
/**
 * source 传参数格式说明
 * 1.serverless hub 源为 `<应用名>` 会下载最新版本，`<应用名>@<应用版本号>` 会下载指定版本
 * 2.github 源为 `<用户名>/<项目名称>` 会下载最新版本，`<用户名>/<项目名称>@<项目发布的版本号>` 会下载指定版本
 * 3.自定义源 为 `<应用名>`， 会下载指定资源
 *
 * registry 参数说明
 * 优先读取方法传入的参数 registry，如果找不到，然后读取 ~/.s/components/set-config.yml 文件里的 registry，
 * 如果找不到，优先读取 serverless hub 源，如果找不到，最后读取 github 源
 * 1.serverless hub 源 为：http://registry.devsapp.cn/simple
 * 2.github 源为：https://api.github.com/repos
 * 3.自定义源
 *
 * target 参数，下载资源的存放路径
 * /
```

```typescript
const { loadComponent } = require('@serverless-devs/core');
loadApplication('Serverless-Devs/Serverless-Devs');
// loadApplication('Serverless-Devs/Serverless-Devs', 'https://api.github.com/repos');
```

- 支持下载特定版本的应用

```typescript
const { loadComponent } = require('@serverless-devs/core');
loadApplication('Serverless-Devs/Serverless-Devs@1.1.13');
```

## spinner

#### 状态展示

```typescript
const { spinner } = require('@serverless-devs/core');

function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

async start() {
  async test() {
    const vm = spinner('开始执行');
    await sleep(1000);
    try {
      await sleep(1500);
      vm1.succeed('执行成功.');
    } catch(ex) {
      vm1.fail('执行失败')
      throw ex;
    }
  }
}

```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01L81nr81ZfimlgCPpp_!!6000000003222-1-tps-1312-73.gif)

## zip

#### 用于压缩文件

```typescript
/**
 * codeUri: 打包的路径
 * include: 额外包括的文件（list）
 * exclude: 不包括的文件（list）
 * outputFileName: 打包后的文件名称，默认值demo.zip
 * outputFilePath: 输出的路径
 */
zip({ codeUri, include, exclude, outputFileName, outputFilePath });
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01YOb4ij1dRImEsBk1i_!!6000000003732-1-tps-1312-103.gif)

## unzip

#### 用于解压文件，具体使用请查看[文档](https://github.com/kevva/decompress)

## help

显示文档帮助信息，具体使用请查看[文档](https://github.com/75lb/command-line-usage)

```typescript
const { help } = require('@serverless-devs/core');

function test() {
  const sections = [
    {
      header: 'A typical app',
      content: 'Generates something {italic very} important.',
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'input',
          typeLabel: '{underline file}',
          description: 'The input to process.',
        },
        {
          name: 'help',
          description: 'Print this usage guide.',
        },
      ],
    },
    {
      header: 'Examples',
      content: [
        {
          desc: '1. A concise example. ',
          example: '$ example -t 100 lib/*.js',
        },
        {
          desc: '2. A long example. ',
          example: '$ example --timeout 100 --src lib/*.js',
        },
        {
          desc:
            '3. This example will scan space for unknown things. Take cure when scanning space, it could take some time. ',
          example:
            '$ example --src galaxy1.facts galaxy1.facts galaxy2.facts galaxy3.facts galaxy4.facts galaxy5.facts',
        },
      ],
    },
  ];
  help(sections);
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN0105D6t51lUWUKlSt3g_!!6000000004822-1-tps-1312-326.gif)

输出数据

```

A typical app

  Generates something very important.

Options

  --input file    The input to process.
  --help string   Print this usage guide.

Examples

  1. A concise example.                                                                                          $ example -t 100 lib/*.js
  2. A long example.                                                                                             $ example --timeout 100 --src lib/*.js
  3. This example will scan space for unknown things. Take cure when scanning space, it could take some time.    $ example --src galaxy1.facts galaxy1.facts galaxy2.facts galaxy3.facts galaxy4.facts galaxy5.facts

```

## commandParse

命令行参数解析工具，用于解析命令行参数。格式为 commandParse(Input, options)
解析工具采用 [minimist](https://github.com/substack/minimist) 详细使用查看[文档](https://github.com/substack/minimist)

```typescript
const { commandParse } = require('@serverless-devs/core');

function test() {
  const c = commandParse({
    args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
  });
  console.log(c);
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01dsAaDX1ayKUcjHVcU_!!6000000003398-1-tps-1312-273.gif)

输出数据

```js
{
  rawData: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
  data: {
    _: [ 'foo', 'bar', 'baz' ],
    x: 3,
    y: 4,
    n: 5,
    a: true,
    b: true,
    c: true,
    beep: 'boop'
  }
}
```

## getCredential

#### 用于获取密钥信息，可接收（inputs, alias, ...envKeys)

- 不传任何参数的时候，会获取 `default` 密钥信息

```typescript
const { getCredential } = require('@serverless-devs/core');
async function get() {
  const c = await getCredential();
  console.log('c', c);
}
```

![demo](https://img.alicdn.com/imgextra/i3/O1CN016HGrtn1fZCrBDZWHb_!!6000000004020-1-tps-1215-319.gif)

- 传参数

```typescript
const { getCredential } = require('@serverless-devs/core');
async function get() {
  // 组件接收的inputs
  const inputs = {};
  const c = await getCredential(inputs, 'custom', 'AccountIdByCustom', 'SecretIDByCustom');
  console.log('c', c);
}
```

![demo](https://img.alicdn.com/imgextra/i1/O1CN01fBzz3W1ljBAyz0wfc_!!6000000004854-1-tps-1215-702.gif)

## setCredential

#### 用于设置密钥信息, 可接收（...envKeys)

- 不传任何参数的时候，会提供 模版[alibaba/aws/azure/baidu/google/huawei/tencent/custom] 来 创建密钥信息

```typescript
const { setCredential } = require('@serverless-devs/core');

async function set() {
  const c = await setCredential();
  console.log('c', c);
}
```

![demo](https://img.alicdn.com/imgextra/i2/O1CN01D1CUb01NlsjX7Rtvq_!!6000000001611-1-tps-1215-459.gif)

- 传参数

```typescript
const { setCredential } = require('@serverless-devs/core');

async function set() {
  const c = await setCredential('AccountIdByCustom', 'SecretIDByCustom');
  console.log('c', c);
}
```

![demo](https://gw.alicdn.com/imgextra/i2/O1CN01w8fORm1sYN8lWmGsb_!!6000000005778-1-tps-1215-459.gif)

## decryptCredential

```typescript
const { decryptCredential } = require('@serverless-devs/core');

const c = decryptCredential({
  AccountID: 'U2FsdGVkX1+jAj7Kxp3X1lHwFSUtBoSqkpFXp/dYEB0=',
  SecretID: 'U2FsdGVkX1/NKNJ6MDERFRhQ6GIukaUogeKcFJrhMRU=',
  SecretKey: 'U2FsdGVkX1/OSprVoM65l3trkwg4CgAjtQZzt/wN798=',
});
console.log('c', c);
```

#### 用于解密密钥信息

## getState

#### 用于获取文件内容， 文件存放于 ~/.s 目录下面。

- 第一个参数：文件名称
- 第二个参数：文件存放路径

```typescript
const { getState } = require('@serverless-devs/core');

async function get() {
  const c = await getState('state');
  console.log('c', c);
}
```

![demo](https://img.alicdn.com/imgextra/i4/O1CN01pXFJUZ1IVKKVKhvny_!!6000000000898-1-tps-1215-97.gif)

## setState

#### 用于设置文件内容， 文件存放于 ~/.s 目录下面。

- 第一个参数：文件名称
- 第二个参数：文件内容
- 第三个参数：文件存放路径

```typescript
const { setState } = require('@serverless-devs/core');

async function set() {
  const c = await setState('state', { name: '名称', age: 18 }, 'state_cache');
  console.log('c', c);
}
```

![demo](https://img.alicdn.com/imgextra/i4/O1CN01pXFJUZ1IVKKVKhvny_!!6000000000898-1-tps-1215-97.gif)

## validateProps

#### 用于检查 input 的 yaml 格式是否正确，通过返回 null，不通过返回 错误信息

```typescript
const { validateProps } = require('@serverless-devs/core');
const input = {
  Provider: 'alibaba',
  Component: 'fc',
  Properties: {
    Region: 'cn-hangzhou',
    Service: {
      Name: 'ServerlessToolProject',
      Log: {
        LogStore: 'loghub中的logstore名称',
        Project: 'loghub中的project名称',
      },
      Nas: [
        {
          label: 'xx',
          value: 'xx',
        },
        {
          label: '',
          value: 'xx',
        },
      ],
    },
  },
};

// publish.yaml Properties demo
// Properties:
//   Region:
//     Required: true
//     Type:
//     - Enum:
//       - cn-hangzhou
//       - cn-shanghai
//   Service:
//     Required: false
//     Type:
//     - Struct:
//         Name:
//           Required: true
//           Type:
//           - String
//         Log:
//           Required: true
//           Type:
//           - Enum[简单配置/Simple configuration]:
//             - Auto
//           - Struct[详细配置/Detailed configuration]:
//               LogStore:
//                 Required: true
//                 Description:
//                   zh: loghub中的logstore名称
//                   en: Logstore name in loghub
//                 Type:
//                 - String
//               Project:
//                 Required: true
//                 Description:
//                   zh: loghub中的project名称
//                   en: Project name in loghub
//                 Type:
//                 - String
//         Nas:
//           Required: true
//           Type:
//           - List:
//               label:
//                 Required: true
//                 Type:
//                 - String
//               value:
//                 Required: true
//                 Type:
//                 - String

async function test() {
  const errors = await validateProps(input);
  console.log('errors', errors);
}
```

![demo](https://img.alicdn.com/imgextra/i1/O1CN01vMID0V1UvE7SfqloB_!!6000000002579-1-tps-1215-697.gif)

## modifyProps

#### 用于修改 <s.yml> 文件的 `prop` 属性， 第一次执行该方法时，会备份<s.yml>到<s.origin.yml>

第一个参数接收 组件名称
第二个参数 接收 prop，其值会 merge 到 <s.yml> 的 prop
第三个参数 接收 <s.yml> 的路径

```typescript
const { modifyProps } = require('@serverless-devs/core');

// s.yml demo

// edition: 1.0.0
// services:
//   website:
//     component: /Users/shihuali/workspace/website/lib/index.js
//     access: my
//     props:
//       bucket: shl-website-test01
//       src:
//         src: ./src
//         dist: ./build
//         hook: npm run build
//         index: index.html
//         error: index.html
//       region: cn-shanghai
//       hosts:
//         - host: shl2.shihuali.top
//           https:
//             certInfo:
//               switch: 'on'
//               certType: free
//               certName: xxx
//               serverCertificate: xxx
//               privateKey: xxx
//             http2: 'on'
//             forceHttps: 'on'
//           access:
//             referer:
//               refererType: blacklist
//               allowEmpty: true
//               referers:
//                 - aliyun.com
//                 - taobao.com

modifyProps('website', {
  bucket: 'shl-website-test01',
});
```

## installDependency

#### 用于安装依赖

```typescript
const { installDependency } = require('@serverless-devs/core');

installDependency({ cwd: process.cwd(), stdio: 'inherit', production: true });
```

## getYamlContent

#### 用于获取文件内容，兼容 yaml 和 yml 文件

```typescript
const { getYamlContent } = require('@serverless-devs/core');

// 路径 请更换为 自己项目的 yaml或者yml文件的 当前路径
getYamlContent('/Users/shihuali/workspace/s-core/s.yaml');
```
