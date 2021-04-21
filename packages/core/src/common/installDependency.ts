import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { exec, StdioOptions } from 'child_process';
import spinner from './spinner';

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
  } = {},
) => {
  return new Promise((resolve, reject) => {
    const installDirectory = options.baseDir;
    const pkgJson: string = path.join(installDirectory, 'package.json');
    if (!fs.existsSync(pkgJson)) {
      fs.writeFileSync(pkgJson, '{}');
    }
    const spin = spinner('Dependencies installing...');
    const registry = options.registry ? ` --registry=${options.registry}` : '';
    exec(
      `${process.env.NPM_CLIENT || 'npm'} install ${
        // eslint-disable-next-line no-nested-ternary
        options.npmList ? `${options.npmList.join(' ')}` : options.production ? '--production' : ''
      }${registry}`,
      { cwd: installDirectory },
      (err) => {
        spin.stop();
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
  await npmInstall({
    baseDir: cwd,
    production: get(options, 'production', true),
  });
}

export default installDependency;
