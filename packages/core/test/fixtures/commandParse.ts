import { commandParse } from '../../src/common';

function test() {
  const c = commandParse({
    args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
  });
  console.log(c);
}

test();
