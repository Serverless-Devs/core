# Component

## 使用

1.decorator 使用方式(推荐)

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  async deploy() {
    await this.component.load('fc', 'alibaba');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01odpYZ727xlK1uHeMH_!!6000000007864-1-tps-1337-112.gif)

2. 类使用方式(在纯函数中)

```typescript
const { Component } = require('@serverless-devs/core');

async function componentDemo() {
  return await Component.load('fc', 'alibaba');
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01odpYZ727xlK1uHeMH_!!6000000007864-1-tps-1337-112.gif)

## API 接口

#### load

- 用于加载组件,组件会下载到 ~/.s/components 目录下面。

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  async deploy() {
    await this.component.load('fc', 'alibaba');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01odpYZ727xlK1uHeMH_!!6000000007864-1-tps-1337-112.gif)

- 支持下载特定版本的组件使用方式为

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  async deploy() {
    this.component.load('fc@0.1.2', 'alibaba');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01odpYZ727xlK1uHeMH_!!6000000007864-1-tps-1337-112.gif)

#### args

命令行参数解析工具，用于解析命令行参数。格式为 args(Input, options)
解析工具采用 [minimist](https://github.com/substack/minimist) 详细使用查看[文档](https://github.com/substack/minimist)

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  args() {
    return this.component.args({
      args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
    });
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01FINmqV1RX0JpUmEx3_!!6000000002120-1-tps-1337-185.gif)

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

## credentials

用于获取密钥信息, 目前 Provider 支持 [alibaba/aws/azure/baidu/google/huawei/tencent/custom]

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  async credentials() {
    const input = {
      Args: '',
      State: {},
      Project: {
        ProjectName: 'ExpressComponent',
        Component: 'express',
        // Provider: 'alibaba',
        AccessAlias: 'dankun',
      },
      Properties: {
        Region: 'cn-hangzhou',
        Function: {
          Name: 's-function-1611581703839',
          Description: 'This Function Powered By Serverless Devs Tool',
          Handler: 'index.handler',
          MemorySize: 512,
          Runtime: 'custom',
          Timeout: 60,
          Triggers: [Array],
          CodeUri: './src',
        },
        Service: {
          Name: 's-service',
          Description: 'This Service Powered By Serverless Devs Tool',
        },
      },
    };
    return await this.component.credentials(input);
  }
}
```

- Provider 为空的 case

![demo](https://img.alicdn.com/imgextra/i2/O1CN011qZLkF203hWviFAS9_!!6000000006794-1-tps-1337-221.gif)

- Provider 为 alibaba 的 case

![demo](https://img.alicdn.com/imgextra/i2/O1CN01VgcDDQ1xYtf7dmfdQ_!!6000000006456-1-tps-1337-221.gif)

- Provider 为 custom 的 case

![demo](https://img.alicdn.com/imgextra/i3/O1CN01vCLAUJ1g5GZQuOIZ9_!!6000000004090-1-tps-1337-221.gif)
