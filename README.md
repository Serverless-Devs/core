# s-core使用文档

s-core是Serverless-Devs-Tool的一个官方组件，通过该组件您可以轻松处理一些有趣的事情：

- 状态存储、读取
- 组件加载、调用
- 参数转换等

## 整体使用方法

1： 导入依赖，并且做好`extends`即可：

```
const { Component } = require('@serverless-devs/s-core')
class MyComponent extends Component {
}
```

## 状态存储、读取

状态的存储和读取，实际上是在项目中经常用到的，通过这个功能，我们可以存储简单的状态。

首先进行部分初始化：

```
await this.init()
```

然后进行可以读取状态和存储状态：

读取状态：

```
const state = this.state
```

存储状态：

```
this.state = {}
this.save()
```

## 组件加载、调用

例如，我在做某个Component的时候，需要导入fc组件，则：

```
const fc = await this.load('fc', 'Component', 'alibaba');
```

其中load有三个参数，分别是：

- componentName： 组件名
- componentAlias：设置的别名
- provider：组件的提供商

## 参数转换等

参数转换方法是比较简单的，您只需要传入对应参数即可，例如：

```
this.args(inputs.Args)
```

此时，我在控制台输入：

```
s deploy c-1 c-2 c-3 -a b --cc d
```

这一部分的解析结果是：

```
{ Commands: [ 'c-1', 'c-2', 'c-3' ], Parameters: { a: 'b', cc: 'd' } }
```

### 额外参数

其实在this.args()方法中是有三个参数的，即：

- argsStr: 这部分是String类型，是参数
- boolList: 这部分是Array类型，是告诉解析时有那些参数是true/false类型
- moreList: 这部分是Array类型，是告诉解析时有那些参数是带有空格的
- argsList: 这部分是Array类型，是告诉解析时只解析某些参数

例如，当我boolList设置成了`['a', 'b']`，那么当我传入的数据为`-a 1 -b 2 -c 3`

系统为我解析的结果是： 

```
{
  Commands: [ '1', '2' ],
  Parameters: {
    a: true,
    b: true,
    c: '3'
  }
}
```

再例如，当我们的moreList设置为`['start-time']`之后，当我传入`-a 1 2 3 --start-time 4 5 6`

系统为我解析的结果是： 

```
{
  Commands: [ '2', '3' ],
  Parameters: {
    a: '1',
    start-time: '4 5 6'
  }
}
```

例如，当我解析时，是想解析`['--cmd', '-c']`， 则可以传入`argsList为：['--cmd', '-c']`

当我们执行：`s deploy aaaa -a  --cmd 'ls -a && la -a'`

结果为：

```
{ Commands: [ 'test' ], Parameters: { cmd: 'ls -a && la -a' } }
```

## 帮助文档

直接将s启动器的inputs和help传入即可，例如：

```
this.help(inputs, {
    "description": "这是帮助文档",
    "commands": [{
          "name": "指令1",
          "desc": "指令1描述",
        },{
          "name": "指令2",
          "desc": "指令2描述",
        }],
        "args": [{
          "name": "参数1",
          "desc": "参数1描述",
        },{
          "name": "参数2",
          "desc": "参数2描述",
    }],
})

```

当用户执行`s deploy -h/--help`的时候：

```

    这是帮助文档


  Commands: 
      指令1: 指令1描述
      指令2: 指令2描述

  Args: 
      参数1: 参数1描述
      参数2: 参数2描述


```