const { request } = require('../index');

async function init() {
  const { componentName, componentConfig } = process.env;
  await request('https://registry.devsapp.cn/report/component', {
    method: 'post',
    form: true,
    body: {
      component: componentName,
      ...JSON.parse(componentConfig),
    },
  });
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
