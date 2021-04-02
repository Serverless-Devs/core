import { setCredential } from '../../src/common';

// async function get() {
//   const c = await getCredential('alibaba');
//   // const c = await getCredential('google');
//   console.log(c);
// }

// get();

async function set() {
  const c = await setCredential('name', 'age');
  console.log(c);
}

set();
