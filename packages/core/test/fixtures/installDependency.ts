import { installDependency } from '../../src/common';

async function test() {
  const c = await installDependency({
    // cwd: '/Users/shihuali/.s/components/serverlessfans.cn/devsapp/fc-deploy@0.0.7',
    cwd: '/Users/yk/.s/components/github.com/devsapp/midway-hook@0.0.1',
    production: true,
  });
  console.log(c);
}

test();
