const execa = require('execa');
const ora = require('ora');
const regions = 'cn-hangzhou/cn-beijing/cn-beijing/cn-hangzhou/cn-shanghai/cn-qingdao/cn-zhangjiakou/cn-huhehaote/cn-shenzhen/cn-chengdu/cn-hongkong/ap-southeast-1/ap-southeast-2/ap-southeast-3/ap-southeast-5/ap-northeast-1/eu-central-1/eu-west-1/us-west-1/us-east-1/ap-south-1'.split(
  '/',
);

(() => {
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    console.log(`deleting ${region} service...`);

    let listServices = execa.sync('s', ['cli', 'fc-api', 'listServices', '--region', region]);

    if (!listServices.stdout.includes('serviceName')) {
      continue;
    }
    const formatListServices = listServices.stdout.split('\n');
    const serviceNameList = [];
    for (let j = 0; j < formatListServices.length; j++) {
      const service = formatListServices[j];
      if (service.includes('serviceName')) {
        const [, name] = service.split(':');
        serviceNameList.push(name.trim());
      }
    }
    for (let j = 0; j < serviceNameList.length; j++) {
      const serviceName = serviceNameList[j];
      const spin = ora(`${region}:${serviceName} deleting...`).start();
      execa.sync('s', [
        'cli',
        'fc',
        'remove',
        '--region',
        region,
        '--service-name',
        serviceName,
        '-y',
      ]);
      spin.stop();
    }
  }
})();
