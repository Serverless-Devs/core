import { getCredential, setCredential } from '../../src/common';

async function test() {
  getCredential();
  const c = await setCredential('alibaba');
  console.log();
  console.log('c', c);
}

test();
