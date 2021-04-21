import { installDependency } from '../../src/common';

async function test() {
  const c = await installDependency({
    // cwd: '/Users/shihuali/.s/components/serverlessfans.cn/devsapp/fc-deploy@0.0.7',
    cwd: '/Users/shihuali/.s/components/github.com/devsapp/website@0.0.8',
    production: true,
  });
  console.log(c);
}

test();
