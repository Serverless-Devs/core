import { getCredential, decryptCredential } from '../../src/common';

async function get() {
  const c = await getCredential('mycus', 'AccountIdByCustom', 'SecretIDByCustom');
  console.log(c);
}

get();

// async function set() {
//   const c = await setCredential('AccountIdByCustom', 'SecretIDByCustom');
//   console.log(c);
// }

// set();

const info = {
  AccountID: 'U2FsdGVkX1+jAj7Kxp3X1lHwFSUtBoSqkpFXp/dYEB0=',
  SecretID: 'U2FsdGVkX1/NKNJ6MDERFRhQ6GIukaUogeKcFJrhMRU=',
  SecretKey: 'U2FsdGVkX1/OSprVoM65l3trkwg4CgAjtQZzt/wN798=',
};

console.log(decryptCredential(info));
