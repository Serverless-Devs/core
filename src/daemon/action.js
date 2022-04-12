const { setConfig } = require('../index');

(async () => {
  console.log(process.argv, 'daemon');
  setConfig('actionComponentArgv', process.argv);
})();
