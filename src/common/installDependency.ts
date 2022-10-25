import fs from 'fs-extra';
import path from 'path';
import { get } from 'lodash';
import execa, { StdioOption } from 'execa';
import report from './report';
import spinner from './spinner';
import { setState, getState } from './state';
import Crypto from 'crypto-js';

function checkYarn() {
  try {
    execa.sync('yarn', ['-v']);
    return true;
  } catch (error) {
    return false;
  }
}

const npmInstall = async (
  options: {
    npmList?: string[];
    baseDir?: string;
    production?: boolean;
    registry?: string;
    showLoading?: boolean;
    stdio?: 'pipe' | 'ignore' | 'inherit' | readonly StdioOption[];
  } = {},
) => {
  const { showLoading, baseDir, npmList, production } = options;
  let spin;
  if (showLoading) {
    spin = spinner('Dependencies installing...');
  }
  const registry = options.registry ? ` --registry=${options.registry}` : '';
  try {
    const client = checkYarn() ? 'yarn' : get(process.env, 'NPM_CLIENT', 'npm');
    execa.sync(
      `${client} install ${
        // eslint-disable-next-line no-nested-ternary
        npmList ? `${npmList.join(' ')}` : production ? '--production' : ''
      }${registry}`,
      { cwd: baseDir, shell: true, stdio: get(options, 'stdio', 'ignore') },
    );
  } catch (error) {
    report({ type: 'installError', errorMessage: error.message, errorStack: error.stack });
    const errmsg = (error && error.message) || error;
    console.log(` - npm install err ${errmsg}`);
  } finally {
    if (showLoading) {
      spin.stop();
    }
  }
};

interface IOptions {
  cwd?: string;
  production?: boolean;
  stdio?: 'pipe' | 'ignore' | 'inherit' | readonly StdioOption[];
  showLoading?: boolean;
  graceInstall?: boolean;
}

async function installDependency(options: IOptions = {}) {
  const {
    cwd = process.cwd(),
    showLoading = true,
    production = true,
    stdio,
    graceInstall = false,
  } = options;
  const packagePath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packagePath)) return;
  const packageInfo = require(packagePath);
  if (packageInfo.autoInstall === false) return;
  // 优雅安装
  if (graceInstall) {
    const nonInstall = await graceInstallDependency({ cwd, packageInfo, production });
    if (nonInstall) return;
  } else {
    const nodeModulePath = path.join(cwd, 'node_modules');
    if (fs.existsSync(nodeModulePath)) return;
  }
  await npmInstall({
    baseDir: cwd,
    showLoading,
    production,
    stdio,
  });
}

async function graceInstallDependency({ cwd, packageInfo, production }) {
  const filename = `grace-install-dependency-for-${get(packageInfo, 'name', 'package')}`;
  const sPath = path.join(cwd, '.s');
  const encryptedContent = production ? get(packageInfo, 'dependencies', {}) : packageInfo;
  const md5 = Crypto.MD5(JSON.stringify(encryptedContent)).toString();
  const data = await getState(filename, sPath);
  if (get(data, 'md5') === md5) {
    return true;
  }
  await setState(filename, { md5 }, sPath);
  return false;
}

export default installDependency;
