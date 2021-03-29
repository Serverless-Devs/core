import { installDependency } from '../../src/common';

async function test() {
  const c = await installDependency({
    cwd: '/Users/shihuali/workspace/s-core/packages/core',
  });
  console.log(c);
}

test();
