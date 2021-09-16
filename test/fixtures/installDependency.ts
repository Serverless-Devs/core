import { installDependency } from '../../src/common';

async function test() {
  const c = await installDependency({
    cwd: '/Users/shihuali/.s/components/devsapp.cn/devsapp/fc-deploy',
    // cwd: '/Users/yk/.s/components/github.com/devsapp/midway-hook@0.0.1',
    production: true,
  });
  console.log(c);
}

test();



