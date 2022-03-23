import { downloadRequest } from "../../src";

(async () => {
    // https://registry.devsapp.cn/simple/devsapp/strapi/zipball/0.0.9
    // https://registry.devsapp.cn/simple/devsapp/core/zipball/0.1.31
    await downloadRequest('https://registry.devsapp.cn/simple/devsapp/strapi/zipball/0.0.9', './.s/core', {
        extract: true,
        strip: 1,
        filename: 'xx.zip'
    })
    // await downloadRequest('http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg', './.s/a.jpg')
    console.log('end');
})()