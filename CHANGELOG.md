# 更新日志

## [0.0.46] - 2021-04-07

### 变更

- `getCredential` 移除 provider 的概念，接收（alias, ...envKeys)

- `setCredential` 移除 provider 的概念，接收（...envKeys)

- `loadComponet` 针对 serverless 源的组件，移除 provider 的概念，比如原来的 `loadComponet('alibaba/fc-deploy')`, 需更改为`loadComponet('fc-deploy')`

- `loadApplication` 针对 serverless 源的组件，移除 provider 的概念, 同 `loadComponet`; 另支持自定义链接下载, 比如 `loadApplication('vue', 'https://api.github.com/repos/vuejs/vue/zipball/v2.6.11')`
