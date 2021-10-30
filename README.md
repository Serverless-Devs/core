<div align=center> <img src="https://images.devsapp.cn/devs-github/logo.jpg" width="100%"/> </div>
<br>
<p align="center">
  <a href="https://www.npmjs.com/package/@serverless-devs/s">
    <img src="https://img.shields.io/npm/v/@serverless-devs/core" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/@serverless-devs/s">
    <img src="https://img.shields.io/npm/dy/@serverless-devs/core" alt="npm download">
  </a>
  <a href="https://nodejs.org/en/">
    <img src="https://img.shields.io/badge/node-%3E%3D%2010.8.0-brightgreen" alt="node.js version">
  </a>
  <a href="https://github.com/Serverless-Devs/Serverless-Devs/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="license">
  </a>
</p>

Serverless Devs Core 是 Serverless Devs 的官方组件。由于该组件默认支持了包括[组件加载](./docs/common.md#loadComponent)、[日志输出](./docs/logger.md)、[组件参数转换](./docs/common.md#commandparse)、[状态上报](./docs/common.md#report)等在内的通用 Serverless Package 开发能力，所以，通过该组件可以帮助 Serverless Package 开发者快速实现 Serverless Devs 的组件开发。


- [快速安装](#快速安装)
- [使用方法](#使用方法)
    - [decorator 使用方式](#decorator-使用方式)
    - [类使用方式](#类使用方式)
    - [效果展示](#效果展示)
- [接口目录](#接口目录)
- [项目贡献](#项目贡献)
- [开源许可](#开源许可)
- [交流社区](#交流社区)


# 快速安装

组件开发者需要先进行 Node.js(>=10.8.0) 与 NPM 包管理工具的安装，然后通过`npm`指令即可完成`@serverless-devs/core`的安装，例如：

```
npm i @serverless-devs/core -S
```

# 使用方法

Serverless Devs Core 提供了[decorator 使用方式](#decorator-使用方式)和[类使用方式](#类使用方式)等两种使用方法。其中[decorator 使用方式](#decorator-使用方式)是官方所推荐和鼓励的使用方法。

以`logger`能力为例，decorator 使用方式的案例代码为：

## decorator 使用方式

```typescript
const { HLogger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  getDefaultLog() {
    this.logger.info('abc');
  }
}
```

## 类使用方式

以`logger`能力为例，类使用方式的案例代码可以有两种方法。

- 方法1：
    ```typescript
    const { Logger } = require('@serverless-devs/core');
    function loggerDemo() {
      const logger = new Logger('S-CORE');
      logger.info('abc');
    }
    ```
- 方法2：
    ```typescript
    const { Logger } = require('@serverless-devs/core');
    
    function loggerDemo() {
      Logger.info('S-CORE', 'abc');
    }
    ```


## 效果展示

无论是上面的哪种使用方法，最终的效果如下：

![Demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635502865479.gif)


# 接口目录

- [common](./docs/common.md): 通用接口
    - [request](./docs/common.md#request)/[downloadRequest](./docs/common.md#downloadrequest): HTTP 请求
    - [report](./docs/common.md#report) : 组件上报/错误上报
    - [loadComponent](./docs/common.md#loadComponent) : 组件加载
    - [loadApplication](./docs/common.md#loadApplication) : 应用加载
    - [spinner](./docs/common.md#spinner) : 状态展示
    - [zip](./docs/common.md#zip)/[unzip](./docs/common.md#unzip) : 打包/解包
    - [help](./docs/common.md#help): 显示文档帮助信息
    - [commadParse](./docs/common.md#commandparse) : 命令行参数解析工具
    - [getCredential](./docs/common.md#getCredential)/[setCredential](./docs/common.md#setCredential) : 获取/创建密钥信息
    - [decryptCredential](./docs/common.md#decryptCredential) : 用于解密密钥信息
    - [getState](./docs/common.md#getState)/[setState](./docs/common.md#setState) : 获取/设置状态信息
    - [validateProps](./docs/common.md#validateProps) : 检验 `inputs` 的 `Properties` 属性格式
    - [modifyProps](./docs/common.md#modifyProps) : 修改 `s.yml` 文件的 `Properties` 属性
    - [installDependency](./docs/common.md#installDependency) : 安装依赖
    - [getYamlContent](./docs/common.md#getYamlContent) : 用于获取文件内容
    - [....](./docs/common.md) : 更多内容可以参考[common通用接口文档](./docs/common.md)
- [logger](./docs/logger.md): 日志相关接口
    - [log](./docs/logger.md#log) : 打印到终端(具备显示不同颜色的能力)
    - [debug/info/warn/error](./docs/logger.md#levels) : 打印到本地文件以及终端中


# 项目贡献

我们非常希望您可以和我们一起贡献这个项目。贡献内容包括不限于代码的维护、应用/组件的贡献、文档的完善等，更多详情可以参考[ 🏆 贡献指南](./CONTRIBUTING.md)。

# 开源许可

Serverless Devs 遵循 [MIT License](./LICENSE) 开源许可。

位于`node_modules`和外部目录中的所有文件都是本软件使用的外部维护库，具有自己的许可证；我们建议您阅读它们，因为它们的条款可能与[MIT License](./LICENSE)的条款不同。

# 交流社区

您如果有关于错误的反馈或者未来的期待，您可以在 [Issues](https://github.com/Serverless-Devs/core/issues) 中进行反馈和交流。如果您想要加入我们的讨论组或者了解 Serverless Devs Core 的最新动态，您可以通过以下渠道进行：

<p align="center">

| <img src="https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1635407298906_20211028074819117230.png" width="200px" > | <img src="https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1635407044136_20211028074404326599.png" width="200px" > | <img src="https://serverless-article-picture.oss-cn-hangzhou.aliyuncs.com/1635407252200_20211028074732517533.png" width="200px" > |
|--- | --- | --- |
| <center>关注微信公众号：`serverless`</center> | <center>联系微信小助手：`xiaojiangwh`</center> | <center>加入钉钉交流群：`33947367`</center> | 

</p>
