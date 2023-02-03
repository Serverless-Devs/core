const { tracker } = require('../index');

(async () => {
  const inputs = JSON.parse(process.env.inputs);
  await tracker(inputs);
  process.exit();
})().catch(() => {
  process.exit(1);
});
