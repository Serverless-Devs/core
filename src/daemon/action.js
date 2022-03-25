const { fse } = require('../index');

(async () => {
  const { filePath } = process.env;
  if (!filePath) return;
  fse.writeJSONSync(filePath, {
    argv: process.argv,
  });
})();
