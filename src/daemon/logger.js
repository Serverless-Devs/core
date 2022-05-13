const core = require('../index');
const path = require('path');
const { fse: fs, lodash, rimraf } = core;
const logsPath = path.join(core.getRootHome(), 'logs');
const OUT_TIME = 3 * 24 * 60 * 60 * 1000;

async function init() {
  if (fs.existsSync(logsPath)) {
    const dirs = fs.readdirSync(logsPath);
    if (lodash.isEmpty(dirs)) return;
    for (const item of dirs) {
      const filePath = path.join(logsPath, item);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const time = stat.birthtimeMs || stat.ctimeMs;
        if (Date.now() - time > OUT_TIME) {
          rimraf.sync(filePath);
        }
      }
    }
  }
}

(async () => {
  await init();
  process.exit();
})().catch(() => {
  process.exit(1);
});
