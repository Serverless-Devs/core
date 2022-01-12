const { parse } = require('../../lib')

parse({
    // syaml: '/Users/shihuali/workspace/a/start-fc-http-nodejs12/s.yaml',
    // serverName: 'helloworld',
    syaml: '/Users/shihuali/workspace/website/example/s.yml',
    // serverName: 'website',
    method: 'deploy',
    // args: '-y --use-local'
}).then(res=>console.log(res))
