import { installDependency } from '../../src/common';

async function test() {
   await installDependency({cwd: '/Users/shihuali/workspace/a/bug', production:true, graceInstall: true});
}

test();



