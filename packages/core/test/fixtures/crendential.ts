import { getCredential } from '../../src/common';

async function get() {
  const c = await getCredential('alibaba');
  // const c = await getCredential('google');
  console.log('c', c);
}

get();

// async function set() {
//   const c = await setCredential('alibaba');
//   console.log('c', c);
// }

// set();
