import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { exec, StdioOptions } from 'child_process';
import spinner from './spinner';
import { readJsonFile } from '../libs/utils';

interface IOptions {
  cwd?: string;
  production?: boolean;
  stdio?: StdioOptions;
}

const npmInstall = async (
  options: {
    npmList?: string[];
    baseDir?: string;
    production?: boolean;
    registry?: string;
    showLoading?: boolean;
  } = {},
) => {
  return new Promise((resolve, reject) => {
    const { showLoading, baseDir, npmList, production } = options;
    const pkgJson: string = path.join(baseDir, 'package.json');
    if (!fs.existsSync(pkgJson)) {
      fs.writeFileSync(pkgJson, '{}');
    }
    let spin;
    if (showLoading) {
      spin = spinner('Dependencies installing...');
    }
    const registry = options.registry ? ` --registry=${options.registry}` : '';
    exec(
      `${process.env.NPM_CLIENT || 'npm'} install ${
        // eslint-disable-next-line no-nested-ternary
        npmList ? `${npmList.join(' ')}` : production ? '--production' : ''
      }${registry}`,
      { cwd: baseDir },
      (err) => {
        if (showLoading) {
          spin.stop();
        }
        if (err) {
          const errmsg = (err && err.message) || err;
          console.log(` - npm install err ${errmsg}`);
          reject(errmsg);
        } else {
          resolve(true);
        }
      },
    );
  });
};

async function installDependency(options?: IOptions) {
  const cwd = get(options, 'cwd', process.cwd());
  const packageInfo: any = readJsonFile(path.resolve(cwd, 'package.json'));
  if (!packageInfo || !get(packageInfo, 'autoInstall', true)) return;
  const nodeModulePath = path.resolve(cwd, 'node_modules');
  if (fs.existsSync(nodeModulePath)) return;

  await npmInstall({
    baseDir: cwd,
    showLoading: get(options, 'showLoading') === false ? false : true,
    production: get(options, 'production', true),
  });
}

export default installDependency;
