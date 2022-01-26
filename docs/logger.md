# Logger 日志相关文档

- [基础使用](#基础使用)
  - [类使用方式](#类使用方式)
  - [decorator 使用方式](#decorator-使用方式)
  - [效果展示](#效果展示)
- [进阶使用](#进阶使用)
  - [上下文：context](#上下文context)
  - [日志级别：levels](#日志级别levels)
  - [log 方法](#log方法)
  - [task 方法](#task方法)

## 基础使用

### 类使用方式

以`logger`能力为例，类使用方式的案例代码可以有两种方法。

- 方法 1：推荐使用 new Logger()方式
  ```typescript
  const { Logger } = require('@serverless-devs/core');
  function loggerDemo() {
    const logger = new Logger('S-CORE');
    logger.info('abc');
  }
  ```
- 方法 2：使用 Logger 的静态方法，比如：Logger.info

  ```typescript
  const { Logger } = require('@serverless-devs/core');

  function loggerDemo() {
    Logger.info('S-CORE', 'abc');
  }
  ```

### decorator 使用方式

```typescript
const { HLogger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  getDefaultLog() {
    this.logger.info('abc');
  }
}
```

### 效果展示

无论是上面的哪种使用方法，最终的效果如下：

![Demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635502865479.gif)

## 进阶使用

### 上下文：context

用在 `log` 日志中，代表现在处于哪种环境变量中。

```typescript
const { HLogger, Logger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;
  getinfo() {
    this.logger.info('abc');
  }
}

// 或者
const logger = new Logger('S-CORE');
logger.info('abc');

// 或者
Logger.info('S-CORE', 'abc');
```

### 日志级别：levels

在 Serverless Devs Core Logger 中，levels 包括了 `debug`, `info`, `warn`, `error` 等级别。 其中：

- `info`, `warn`, `error` 三个级别的日志会被默认输出
- `debug` 级别日志需要通过`--debug`进行输出

案例代码：

```typescript
const { HLogger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;
  test() {
    this.logger.debug('测试debug');
    this.logger.info('测试info');
    this.logger.warn('测试warn');
    this.logger.error('测试error');
  }
}
```

默认输出：

![demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635505382944.gif)

通过 `--debug` 输出 `debug` 级别的日志：

![demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635505572575.gif)

### log 方法

Serverless Devs Core Logger 提供了类似 `console.log()` 一样的方法：`log()`，通过方法，可以将内容打印到输出流，并且可以配置不同的颜色，例如：

```typescript
const { HLogger, Logger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  log() {
    this.logger.log('黄色打印', 'yellow');
    this.logger.log('绿色打印', 'green');
  }
}
```

运行效果：

![Demo](https://example-static.oss-cn-beijing.aliyuncs.com/github-static/render1635506017315.gif)

### task 方法

为了对[Serverless Devs 的命令行工具输出，进行规范化升级](https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/cli_design.md)，Serverless Devs Core Logger 提供了 task 方法。

- 基本模式下会输出极简的 log 信息
- --debug 模式下会输出详细的 log 信息

```typescript
import { Logger } from '@serverless-devs/core';

function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

(async () => {
  const logger = new Logger('S-CORE');
  await logger.task('Checking', [
    {
      title: 'Checking git status',
      id: 'git status',
      task: async () => {
        logger.debug('debug message');
        await sleep(1000);
      },
    },
    {
      title: 'Checking remote history',
      id: 'remote history',
      enabled: () => Math.random() > 0.5,
      task: async () => {
        await sleep(1000);
      },
    },
    {
      title: 'Install package dependencies with Yarn',
      task: async () => {
        await sleep(1000);
      },
    },
  ]);
})();
```

![Demo](https://img.alicdn.com/imgextra/i3/O1CN01yXv3FN1LllSCzte0b_!!6000000001340-1-tps-917-204.gif)
