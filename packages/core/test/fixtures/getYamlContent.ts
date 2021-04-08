import { getYamlContent } from '../../src/common';

async function test() {
  const c = getYamlContent(
    '/Users/shihuali/workspace/s-core/packages/core/test/fixtures/modifyProps/s.yaml',
  );
  console.log(c);
}

test();
