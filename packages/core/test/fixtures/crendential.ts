import { getCredential } from '../../src/common';

async function get() {
  const c = await getCredential('alibaba');
  // const c = await getCredential('google');
  console.log(typeof c.AccountID);
}

get();

// async function set() {
//   const c = await setCredential('alibaba');
//   console.log(typeof c.AccountID);
// }

// set();
