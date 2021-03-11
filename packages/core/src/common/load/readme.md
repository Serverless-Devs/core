1. cli 配置了 就用起来，否则 github
2. 网页(Electorn) 配置了 就用起来 否则 serverless hub，如果 找不到 -> github 去找

## serverless hub => 下载到到 home 目录

loadComponent('alibaba/express-demo@0.01', 'cli', source) => oss[code up(gitlab)]

## github hub

loadComponent('heimanba/s-core@0.01', 'gui', source)

## 优先使用 source

=> cli 类型 set-config.yml => registry 否则就 github
=> gui 类型 set-config.yml => registry 否则就 srveless hub, 如果 srveless hub 找不到 去 github 找

loadApplication('heimanba/s-core@0.01', 'gui', source) => 下载到当前目录
