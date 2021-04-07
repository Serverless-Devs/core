import { setCredential } from '../../src/common';

// async function get() {
//   const c = await getCredential('custom', 'AccountIdByCustom', 'SecretIDByCustom');
//   console.log(c);
// }

// get();

async function set() {
  const c = await setCredential('AccountIdByCustom', 'SecretIDByCustom');
  console.log(c);
}

set();
