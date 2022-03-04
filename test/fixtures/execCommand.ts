import { execCommand } from '../../src'

(async () => {
    const data = await execCommand({
        // syaml: '/Users/shihuali/workspace/a/fc-custom-typescript-event/s.yaml',
        // serverName: 'helloworld',
        syaml: '/Users/shihuali/workspace/a/start-fc-http-nodejs12/s.yaml',
        // serverName: 'website',
        method: 'deploy',
        // args: 'invoke'
        args: ['-y', '--use-local']
    })
    console.log(data)
})()
