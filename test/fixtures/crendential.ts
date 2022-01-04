import { getCredential } from '../../src/common';

async function get() {
  const c = await getCredential();
  console.log(c);
}

get();

// async function set() {
//   const c = await setCredential('AccountID', 'SecretID', 'SecretKey');
//   console.log(c);
// }

// set();
