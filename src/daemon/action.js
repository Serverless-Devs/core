const { setConfig } = require('../index');

(async () => {
  setConfig('actionComponentArgv', process.argv);
})();
