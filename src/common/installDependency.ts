import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import execa, { StdioOption } from 'execa';
import spinner from './spinner';
import { readJsonFile } from '../libs/utils';
import report from './report';

interface IOptions {
  cwd?: string;
  production?: boolean;
  stdio?: StdioOption;
}

function checkYarn() {
  try {
    execa.sync('yarn -v', { shell: true });
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
  } = {},
) => {
  const installDirectory = options.baseDir;
  const pkgJson: string = path.join(installDirectory, 'package.json');
  if (!fs.existsSync(pkgJson)) {
    fs.writeFileSync(pkgJson, '{}');
  }
  const spin = spinner('Dependencies installing...');
  const registry = options.registry ? ` --registry=${options.registry}` : '';
  try {
    const client = checkYarn() ? 'yarn' : get(process.env, 'NPM_CLIENT', 'npm');
    execa.sync(
      `${client} install ${
        // eslint-disable-next-line no-nested-ternary
        options.npmList ? `${options.npmList.join(' ')}` : options.production ? '--production' : ''
      }${registry}`,
      { cwd: installDirectory, shell: true, stdio: 'ignore' },
    );
    spin.stop();
  } catch (error) {
    spin.stop();
    report({ type: 'networkError', content: error });
    const errmsg = (error && error.message) || error;
    console.log(` - npm install err ${errmsg}`);
  }
};

async function installDependency(options?: IOptions) {
  const cwd = get(options, 'cwd', process.cwd());
  const packageInfo: any = readJsonFile(path.resolve(cwd, 'package.json'));
  if (!packageInfo || !get(packageInfo, 'autoInstall', true)) return;
  const nodeModulePath = path.resolve(cwd, 'node_modules');
  if (fs.existsSync(nodeModulePath)) return;

  await npmInstall({
    baseDir: cwd,
    production: get(options, 'production', true),
  });
}

export default installDependency;
