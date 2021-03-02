import { setState } from '../../src/common';

setState('state', { name: '名称', age: 18 }).then((res) => {
  console.log(res);
});

// import { getState } from '../../src/common';

// getState('state').then((res) => {
//   console.log(typeof res);
// });
