# Component

## 使用

1.decorator 使用方式(推荐)

```typescript
const { HComponent, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  async deploy() {
    await this.component.load('fc', 'alibaba');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01LukqOH1bJr6l77VGk_!!6000000003445-1-tps-1312-200.gif)

2. 类使用方式(在纯函数中)

```typescript
const { Component } = require('@serverless-devs/core');

async function componentDemo() {
  return await Component.load('fc', 'alibaba');
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01LukqOH1bJr6l77VGk_!!6000000003445-1-tps-1312-200.gif)

## API 接口

#### args

命令行参数解析工具，用于解析命令行参数。格式为 args(Input, options)
解析工具采用 [minimist](https://github.com/substack/minimist) 详细使用查看[文档](https://github.com/substack/minimist)

```typescript
const { HComponent, IComponent } = require('@serverless-devs/core');

class ComponentDemo {
  @HComponent() component: IComponent;

  args() {
    return this.component.args({
      args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
    });
  }
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

## credentials

用于获取密钥信息, 目前 Provider 支持 [alibaba/aws/azure/baidu/google/huawei/tencent/custom]

```typescript
const { HComponent, IComponent } = require('@serverless-devs/core');

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

![demo](https://img.alicdn.com/imgextra/i2/O1CN01JBu5EO1Q9oeNdQCzr_!!6000000001934-1-tps-1312-273.gif)

- Provider 为 alibaba 的 case

![demo](https://img.alicdn.com/imgextra/i4/O1CN01EstoE11ltiH06n6rE_!!6000000004877-1-tps-1312-273.gif)

- Provider 为 custom 的 case

![demo](https://img.alicdn.com/imgextra/i2/O1CN013aOETJ1CdfqojG1IH_!!6000000000104-1-tps-1312-337.gif)
