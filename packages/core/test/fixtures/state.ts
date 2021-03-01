// import { setState } from '../../src/common';

// setState('shl', '{age.b').then((res) => {
//   console.log(res);
// });

import { getState } from '../../src/common';

getState('shl').then((res) => {
  console.log(res);
});
