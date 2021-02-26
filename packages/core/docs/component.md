# Component

## 使用

```typescript
const { Component } = require('@serverless-devs/core');

function componentDemo() {
  return Component.args({
    args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
  });
}
```

![Demo](https://img.alicdn.com/imgextra/i1/O1CN01dsAaDX1ayKUcjHVcU_!!6000000003398-1-tps-1312-273.gif)

## API 接口
