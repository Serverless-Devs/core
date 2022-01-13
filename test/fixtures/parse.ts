import { parse } from '../../src'

(() => {
    const data = parse({
        // syaml: '/Users/shihuali/workspace/a/fc-custom-typescript-event/s.yaml',
        // serverName: 'helloworld',
        syaml: '/Users/shihuali/workspace/website/example/s.yml',
        serverName: 'website22',
        method: 'deploy',
        // args: 'invoke'
        // args: '-y --use-local'
    })
    console.log(data)
})()
