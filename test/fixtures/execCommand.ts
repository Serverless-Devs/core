import { execCommand } from '../../src'
import path from 'path'

(async () => {
    const data = await execCommand({
        
        syaml: path.join(__dirname, './start-fc-http-nodejs14/s_en.yaml'),
        args: ['-y', '--use-local'],
        env: {
            // serverless_devs_log_path: '/Users/shihuali/workspace/core/test/fs.log',
            // serverless_devs_log_debug: 'false',
            // default_serverless_devs_auto_log: 'false',
        },
        method: 'deploy',
        globalArgs:{
            // debug: true,
        }
    })
    console.log(data)


})()
