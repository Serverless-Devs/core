const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('component.utils.test', () => {
  it('yaml 测试', async () => {
    const localPath = path.join(os.homedir(), '.s/access.yaml');
    if (fs.existsSync(localPath)) {
      const accessInfo = yaml.safeLoad(fs.readFileSync(localPath, 'utf8'));
      expect(accessInfo).not.toBeNull();
    }
  });
});
