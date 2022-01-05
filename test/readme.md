## 安装 jest

```shell
npm i jest @types/jest ts-jest ts-node -D
```

## 默认会测试 spec 和 test 结尾的 js 文件，所有写单元测试的文件名必须是 sum.spec.js 或者 sum.test.js 这个的格式。

## 在测试用例中使用 describe 表示分组，分组里面一个个的用例, it 语法表示一个用例，expect 表示预期结果，toBe 表示三个等号的比较，如果条件成立单元测试即可通过。

```ts
import { getDataCallback, getDataPromise } from '../util';

// 异步回调
it('测试回调函数', (done) => {
  // done参数
  getDataCallback((data) => {
    expect(data).toEqual({ name: 'callback' });
    done(); // 标识调用完成
  });
});

it('测试promise', () => {
  // 返回的promise会等待完成
  return getDataPromise().then((data) => {
    expect(data).toEqual({ name: 'promise' });
  });
});

it('测试promise', async () => {
  // 使用await语法
  const data = await getDataPromise();
  expect(data).toEqual({ name: 'promise' });
});
```

## 测试覆盖率

- 想要查看测试覆盖率，我们需要先生成配置文件，通过命令

```shell
npx jest --init
```

- 然后还需要在 package.json 中添加一段脚本

```json
{
  "scripts": {
    "test": "jest --coverage"
  }
}
```
