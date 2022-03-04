import { ignoreWalk } from '../../../src';

ignoreWalk({
  path: './test-ignore',
  ignoreFiles: [ '.fcignore', '.signore' ],
  includeEmpty: false,
}).then(res => console.log('ignoreWalk: ', res));

console.log('ignoreWalk.sync: ', ignoreWalk.sync({
  path: './test-ignore/code',
  ignoreFiles: [ '.fcignore', '.signore' ],
  includeEmpty: true,
}));
