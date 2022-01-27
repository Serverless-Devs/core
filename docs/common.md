# Common 通用相关文档

- [request](#request)：HTTP 请求
- [downloadRequest](#downloadRequest)：统一下载的方法
- [report](#report)：组件的部分数据上报
- [loadComponent](#loadComponent)：加载组件
- [loadApplication](#loadApplication)：加载应用
- [spinner](#spinner)：状态展示
- [zip](#zip)：压缩文件
- [unzip](#unzip)：解压文件
- [help](#help)：显示文档帮助信息
- [commandParse](#commandParse)：命令行参数解析工具
- [getCredential](#getCredential)：获取密钥信息
- [setCredential](#setCredential)：设置密钥信息
- [decryptCredential](#decryptCredential)：解密密钥信息
- [getState](#getCredential)：获取状态内容
- [setState](#getCredential)：设置状态内容
- [modifyProps](#modifyProps)：修改 `s.yml` 文件的 `prop` 属性
- [installDependency](#installDependency)：安装依赖
- [getYamlContent](#getYamlContent)：获取文件内容
- [execCommand](#execCommand)：解析 yaml，提供函数的部署能力等

## request

`request`接口，用于 HTTP 请求，用于统一网络请求，支持 `loading` 效果

- GET: 通过 `params` 传递参数，示例代码：

  ```typescript
  const { request } = require('@serverless-devs/core');

  request(url, {
    params: {
      key: 'value',
    },
  });
  ```

- POST: 通过 `body` 传递参数， 默认 `json` 数据，如果需要传递 `form-data`，可设置参数 `form` 为 `true` 即可，示例代码：

  ```typescript
  const { request } = require('@serverless-devs/core');

  request(url, {
    method: 'post',
    body: {
      key: 'value',
    },
    // form: true
  });
  ```

在使用该接口时，如果出现了`error`，系统会默认抛出错误；如果希望不抛出错误信息，可设置参数 `ignoreError` 为 `true` 即可，示例代码：

```typescript
const { request } = require('@serverless-devs/core');

request(url, {
  method: 'post',
  body: {
    key: 'value',
  },
  ignoreError: true,
});
```

在使用该接口时，如果需要增加网络请求时的加载效果，可以增加`hint`参数：

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

运行效果：

![Demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635566096381.gif)

## downloadRequest

`downloadRequest`接口，用于统一下载的方法，该方法会默认带有下载进度条。

示例代码：

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

## report

`report`接口，用于组件的部分数据上报。

示例代码：

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

`loadComponent`接口是 `load` 方法的`别名`，用于加载组件，加载后的组件会下载到 `~/.s/components` 目录下面

- 使用方法 1：基础使用方法，`loadComponent(source: string, registry?: Registry, params: any)`

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
   */

  const { loadComponent } = require('@serverless-devs/core');
  loadComponent('devsapp/fc-deploy');
  ```

- 使用方法 2：下载特定版本的组件
  ```typescript
  const { loadComponent } = require('@serverless-devs/core');
  loadComponent('devsapp/fc-deploy@0.1.2');
  ```
- 使用方法 3：加载本地组件
  ```typescript
  const { loadComponent } = require('@serverless-devs/core');
  loadComponent('/Users/shihuali/.s/components/serverlessfans.com/alibaba/fc@0.1.2');
  ```

## loadApplication

与`loadComponent`接口类似，只不过`loadApplication`接口是对应用进行加载，支持下载到指定目录，如果不指定，则默认会下载到当前目录。

- 使用方法 1：基础使用方法，`loadApplication(source: string, registry?: string, target?:string)`

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
   */

  const { loadComponent } = require('@serverless-devs/core');
  loadApplication('Serverless-Devs/Serverless-Devs');
  // loadApplication('Serverless-Devs/Serverless-Devs', 'https://api.github.com/repos');
  ```

- 使用方法 2：下载特定版本的应用
  ```typescript
  const { loadComponent } = require('@serverless-devs/core');
  loadApplication('Serverless-Devs/Serverless-Devs@1.1.13');
  ```

## spinner

`spinner`接口，用于状态展示。

示例代码：

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

## zip

`zip`接口，用于压缩文件。

示例代码：

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

## unzip

`unzip`接口，用于解压文件，具体使用请查看[文档](https://github.com/kevva/decompress)

## help

`help`接口，用于显示文档帮助信息，具体使用请查看[文档](https://github.com/75lb/command-line-usage)

示例代码：

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
          desc: '3. This example will scan space for unknown things. Take cure when scanning space, it could take some time. ',
          example:
            '$ example --src galaxy1.facts galaxy1.facts galaxy2.facts galaxy3.facts galaxy4.facts galaxy5.facts',
        },
      ],
    },
  ];
  help(sections);
}
```

效果展示：

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

`commandParse`接口，是命令行参数解析工具，用于解析命令行参数。格式为 `commandParse(Input, options)`

解析工具采用 [minimist](https://github.com/substack/minimist) ，详细使用查看[文档](https://github.com/substack/minimist)

示例代码：

```typescript
const { commandParse } = require('@serverless-devs/core');

function test() {
  const c = commandParse({
    args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
  });
  console.log(c);
}
```

效果展示：

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

`getCredential`接口，用于获取密钥信息，可接收`(inputs, alias, ...envKeys)`

- 使用方法 1：不传任何参数的时候，会获取 `default` 密钥信息
  ```typescript
  const { getCredential } = require('@serverless-devs/core');
  async function get() {
    const c = await getCredential();
    console.log('c', c);
  }
  ```
- 使用方法 2：传参数，获取指定的密钥信息
  ```typescript
  const { getCredential } = require('@serverless-devs/core');
  async function get() {
    // 组件接收的inputs
    const inputs = {};
    const c = await getCredential(inputs, 'custom', 'AccountIdByCustom', 'SecretIDByCustom');
    console.log('c', c);
  }
  ```

## setCredential

`setCredential`接口，用于设置密钥信息, 可接收`(...envKeys)`

- 使用方法 1：不传任何参数的时候，会提供模版[alibaba/aws/azure/baidu/google/huawei/tencent/custom](https://github.com/Serverless-Devs/Serverless-Devs/tree/master/docs/zh/command/config.md) 来创建密钥信息；
  ````typescript
  const { setCredential } = require('@serverless-devs/core');
      async function set() {
        const c = await setCredential();
        console.log('c', c);
      }
      ```
  ````
- 使用方法 2：传参数，根据指定内容创建密钥信息；

  ```typescript
  const { setCredential } = require('@serverless-devs/core');

  async function set() {
    const c = await setCredential('AccountIdByCustom', 'SecretIDByCustom');
    console.log('c', c);
  }
  ```

## decryptCredential

`decryptCredential`接口，用于解密密钥信息，由于 Serverless Devs 为了进大可能地保证用户密钥等敏感信息的配置安全，所以在对密钥信息进行存储时，进行了加密存储，通过该方法可以进行解密。

示例代码：

```typescript
const { decryptCredential } = require('@serverless-devs/core');

const c = decryptCredential({
  AccountID: 'U2FsdGVkX1+jAj7Kxp3X1lHwFSUtBoSqkpFXp/dYEB0=',
  SecretID: 'U2FsdGVkX1/NKNJ6MDERFRhQ6GIukaUogeKcFJrhMRU=',
  SecretKey: 'U2FsdGVkX1/OSprVoM65l3trkwg4CgAjtQZzt/wN798=',
});
console.log('c', c);
```

## getState

`getState`接口，用于获取状态内容， 文件存放于 `~/.s` 目录下面。

该接口共有三个参数：

- 第一个参数：状态名称
- 第二个参数：状态存放路径

示例代码：

```typescript
const { getState } = require('@serverless-devs/core');

async function get() {
  const c = await getState('state');
  console.log('c', c);
}
```

## setState

`setState`接口，用于设置状态内容， 文件存放于 `~/.s` 目录下面。

该接口共有三个参数：

- 第一个参数: 状态名称
- 第二个参数: 状态内容
- 第三个参数: 状态存放路径

示例代码：

```typescript
const { setState } = require('@serverless-devs/core');

async function set() {
  const c = await setState('state', { name: '名称', age: 18 }, 'state_cache');
  console.log('c', c);
}
```

## validateProps

`validateProps`接口，用于检查 `yaml` 格式是否正确，可以直接传入 Serverless Devs 工具的 `inputs` 参数即可，通过返回 `null`，不通过返回错误信息。

示例代码：

```typescript
const { validateProps } = require('@serverless-devs/core');
const inputs = {};
async function test() {
  const errors = await validateProps(inputs);
  console.log('errors', errors);
}
```

## modifyProps

`modifyProps`接口，用于修改 `s.yml` 文件的 `prop` 属性。

> 第一次执行该方法时，会备份`s.yml`到`s.origin.yml`

该接口共有三个参数：

- 第一个参数: 应用中的服务名
- 第二个参数: 对应服务的 `prop`，其值会 merge 到 `s.yml` 的 `prop`
- 第三个参数: `s.yml` 的路径

例如，某应用的`s.yaml`为：

```yaml
edition: 1.0.0
services:
  website:
    component: /Users/shihuali/workspace/website/lib/index.js
    access: my
    props:
      bucket: shl-website-test01
      src:
        src: ./src
        dist: ./build
        hook: npm run build
```

此时可以指定`website`服务，进行处理：

```typescript
const { modifyProps } = require('@serverless-devs/core');

modifyProps('website', {
  bucket: 'shl-website-test01',
});
```

## installDependency

`installDependency`接口，主要用于安装依赖。

示例代码：

```typescript
const { installDependency } = require('@serverless-devs/core');

installDependency({ cwd: process.cwd(), stdio: 'inherit', production: true });
```

## getYamlContent

`getYamlContent`接口，用于获取文件内容，兼容 `yaml` 和 `yml` 文件。

示例代码：

```typescript
const { getYamlContent } = require('@serverless-devs/core');
getYamlContent('s.yaml');
```

## execCommand

`execCommand(config)`接口，用于解析 yaml，提供函数的部署能力等。

- config.syaml 参数选填，默认为 `prcoess.cwd()` 下的 `s.yaml/s.yml`文件。
- config.serverName 参数选填，指定服务进行操作。
- config.method 参数必填，组件调用的方法名称，比如 deploy, remove 等。
- config.args 参数选填，对应 `process.argv.slice(2)`。
- config.globalArgs 参数选填：
  - debug 参数选填, 是否开启 debug 模式。
  - skipActions 参数选填, 是否跳过 actions 模块。
  - access 参数选填, 指定密钥进行操作。

```typescript
import * as core from '@serverless-devs/core';

(async () => {
  const data = await core.execCommand({
    syaml: 's.yaml',
    serverName: 'helloworld',
    method: 'deploy',
    args: ['-y', '--use-local'],
  });

  console.log(data);
})();
```
