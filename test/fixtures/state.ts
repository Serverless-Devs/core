import { setState } from '../../src/common';

setState('state', { name: '名称', age: 19 }).then((res) => {
  console.log(res);
});

import { getState } from '../../src/common';

getState('state', '/Users/shihuali/workspace/core/test/fixtures/.s/state_cache').then((res) => {
  console.log(res);
});
