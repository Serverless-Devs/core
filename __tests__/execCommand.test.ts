import path from 'path';
import { execCommand } from '../src';

test('execCommand test tracker', async () => {
  const res = await execCommand({
    syaml: path.join(__dirname, 'fixtures', 'tracker-app', 's.yaml'),
    args: ['-y', '--use-local'],
    method: 'deploy',
    globalArgs: {
      debug: true,
    },
  });
  expect(res).toEqual({
    helloworld: { message: 'this is a local fc' },
    'next-helloworld': { message: 'this is a local fc' },
  });
});
