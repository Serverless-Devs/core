# Logger

## 使用

1. decorator 使用方式(推荐)

```typescript
const { Component, IComponent } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  getDefaultLog() {
    this.logger.info('abc');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01CJ2He61oBEeuhhYLK_!!6000000005186-1-tps-1312-73.gif)

2. 类使用方式

- 推荐使用 new Logger()方式

```typescript
const { Logger } = require('@serverless-devs/core');
function loggerDemo() {
  const logger = new Logger('S-CORE');
  logger.info('abc');
}
```

- Logger.info 等方法目前只做兼容，不会写入文件日志

```typescript
const { Logger } = require('@serverless-devs/core');

function loggerDemo() {
  Logger.info('S-CORE', 'abc');
}
```

![Demo](https://img.alicdn.com/imgextra/i4/O1CN01rMXgGM1wJx7iIBckd_!!6000000006288-1-tps-1215-142.gif)

## context

用在 log 日志中，代表现在处于哪种环境变量中。

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

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01TSrTX01YZ1NAB8B56_!!6000000003072-2-tps-1376-102.png)

## levels

#### levels 包含 debug | info | warn | error, 默认输出 info | warn | error 级别的 log

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

![demo](https://img.alicdn.com/imgextra/i4/O1CN01sMzK2j1Pl5GUqUBaq_!!6000000001880-1-tps-1215-263.gif)

## 通过 --debug 开启 debug

![demo](https://img.alicdn.com/imgextra/i4/O1CN01ntQCWI1kySld8wzgJ_!!6000000004752-1-tps-1215-285.gif)
可以看到把 debug 日志打印出来了

## log

```typescript
const { HLogger, Logger, ILogger } = require('@serverless-devs/core');

class LoggerDemo {
  @HLogger('S-CORE') logger: ILogger;

  log() {
    this.logger.log('开始执行..,', 'yellow');
    this.logger.log('执行成功', 'green');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i3/O1CN01uL8Q5T218ZM3Anfn4_!!6000000006940-2-tps-974-98.png)

打印到输出流，类似 console.log 效果。可以配置不同颜色显示
