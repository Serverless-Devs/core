import fs from 'fs-extra';
import path from 'path';
import get from 'lodash.get';
import { spawnSync, StdioOptions } from 'child_process';
import spinner from './spinner';

interface IOptions {
  cwd?: string;
  production?: boolean;
  stdio?: StdioOptions;
}

/**
 * @param options
 * @cwd 可选参数，表示执行安装依赖的路径，默认值为 `当前路径`
 * @production 可选参数，表示是否只安装生产环境的依赖，默认值为 `false`
 * @stdio 可选参数，安装依赖cmd里的ui展示，默认值取值逻辑为 首先判断环境变量里是否包含 `--verbose`，如果包含为 `inherit`，否则为 `ignore`
 */

async function installDependency(options?: IOptions) {
  const cwd = get(options, 'cwd', process.cwd());
  const existPackageJson = fs.existsSync(path.resolve(cwd, 'package.json'));
  if (existPackageJson) {
    const spin = spinner('Installing dependencies in serverless-devs core ...');
    const result = spawnSync(
      `npm install ${
        get(options, 'production') ? '--production' : ''
      } --registry=https://registry.npm.taobao.org`,
      [],
      {
        cwd,
        stdio: get(
          options,
          'stdio',
          process.env?.temp_params?.includes('--verbose') ? 'inherit' : 'ignore',
        ),
        shell: true,
      },
    );
    if (get(result, 'status') === 0) {
      spin.succeed();
      return Promise.resolve(true);
    }
    spin.fail();
    return Promise.reject('> Execute Error');
  }
}

export default installDependency;
