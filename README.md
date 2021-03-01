# s-core 使用文档

s-core 是 Serverless-Devs 的一个官方组件，通过该组件您可以轻松处理一些有趣的事情：

- 组件加载
- 组件参数转换
- 日志输出
- HTTP 请求,文件下载
- 状态上报
- 打包压缩
- 获取密钥信息

## 安装

```
npm i @serverless-devs/core -S
```

## 整体使用方法

1. decorator 使用方式(推荐)

- logger demo

```typescript
const { HLogger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  getDefaultLog() {
    this.logger.info('abc');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i4/O1CN01rMXgGM1wJx7iIBckd_!!6000000006288-1-tps-1215-142.gif)

2. 类使用方式

- logger demo

```typescript
const { Logger } = require('@serverless-devs/core');
function loggerDemo() {
  const logger = new Logger('S-CORE');
  logger.info('abc');
}
```

或者

```typescript
const { Logger } = require('@serverless-devs/core');

function loggerDemo() {
  Logger.info('S-CORE', 'abc');
}
```

![Demo](https://img.alicdn.com/imgextra/i4/O1CN01rMXgGM1wJx7iIBckd_!!6000000006288-1-tps-1215-142.gif)

## 详细文档

#### [common](https://github.com/Serverless-Devs/s-core/blob/develop/packages/core/docs/common.md)

- load 组件加载, 组件会加载到 ~/.s/components 目录下
- commadParse 命令行参数解析工具，用于解析命令行参数。格式为 args(Input, options) 解析工具采用 minimist 详细使用查看
- getCredential，setCredential 用于获取和创建密钥信息, 目前 Provider 支持 [alibaba/aws/azure/baidu/google/huawei/tencent/custom(自定义)]
- HTTP 请求 (request/download)
- report (错误上报)
- spinner (状态展示)
- zip/unzip (打包/解包)
- help 显示文档帮助信息
- i18n 用于国际化
- getState，setState 用于获取和设置文件内容

#### [logger](https://github.com/Serverless-Devs/s-core/blob/develop/packages/core/docs/logger.md)

- log 打印到终端, 具备显示不同颜色的能力
- info/debug/warn/error 打印到本地文件以及终端中
