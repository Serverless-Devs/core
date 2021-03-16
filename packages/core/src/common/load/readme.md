1. cli 配置了 就用起来，否则 github
2. 网页(Electorn) 配置了 就用起来 否则 serverless hub，如果 找不到 -> github 去找

## serverless hub => 下载到到 home 目录

loadComponent('alibaba/express-demo@0.01', source) => oss[code up(gitlab)]

## github hub

loadComponent('heimanba/s-core@0.01', source)

## 优先使用 source

- (process.versions as any).electron

=> cli 类型 set-config.yml => registry 否则就 github, 如果 github 找不到 去 serverless hub 找
=> gui 类型 set-config.yml => registry 否则就 serverless hub, 如果 serverless hub 找不到 去 github 找

loadApplication('heimanba/s-core@0.01', source) => 下载到当前目录
