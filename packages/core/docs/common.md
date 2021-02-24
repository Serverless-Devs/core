## request

#### 用于统一 HTTP 网络请求。加上 loading 效果

```typescript
const { request } = require('@serverless-devs/core');

function test_request_hint() {
  request('https://api.github.com/users/octocat', {
    method: 'get',
    data: {
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

![Demo](https://img.alicdn.com/imgextra/i4/O1CN015PTSmc1Kq3TybwnpK_!!6000000001214-1-tps-729-61.gif)

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

![Demo](https://img.alicdn.com/imgextra/i2/O1CN018yjxKC1XdJTAffXBY_!!6000000002946-1-tps-729-61.gif)

## report

#### 组件上报

```typescript
const { report, HLogger, ILogger } = require('@serverless-devs/core');

class ReportDemo {
  @HLogger('S-CORE') logger: ILogger;
  async component() {
    await report('组件数据上报', {
      type: 'component',
      context: 'fc',
      params: {
        action: 'deploy',
        account: '123435',
      },
    });
    this.logger.info('成功上报');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i2/O1CN01KvGJug1SDb9dHSlXV_!!6000000002213-1-tps-1337-112.gif)

#### 错误上报

```typescript
const { report, HLogger, ILogger } = require('@serverless-devs/core');

class ReportDemo {
  @HLogger('S-CORE') logger: ILogger;
  async error() {
    await report('错误上报', {
      type: 'error',
      context: 'fc',
    });
    this.logger.error('错误上报');
  }
}
```

![Demo](https://img.alicdn.com/imgextra/i4/O1CN01SPmZbn1N6f4qvwaQp_!!6000000001521-1-tps-1337-112.gif)

## spinner

#### Elegant terminal spinner

```typescript
const { spinner } = require('@serverless-devs/core');

function sleep(timer: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), timer);
  });
}

async start() {
  const vm = spinner('开始执行');
  await sleep(1000);
  vm.text = 'hhh';
  vm.color = 'red';
  await sleep(1000);
  vm.succeed('执行成功');
}

```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01hEm5Uf1Er4fe9JqW0_!!6000000000404-1-tps-1337-112.gif)

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

![Demo](https://img.alicdn.com/imgextra/i3/O1CN01fypNFP1NkxvharJmk_!!6000000001609-1-tps-1337-112.gif)

## unzip

#### 用于解压文件，具体使用请查看[文档](https://github.com/kevva/decompress)

![Demo](https://img.alicdn.com/imgextra/i3/O1CN01fypNFP1NkxvharJmk_!!6000000001609-1-tps-1337-112.gif)
