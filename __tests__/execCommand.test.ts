import path from 'path';
import { execCommand } from '../src';

test('execCommand test tracker success', async () => {
  const res = await execCommand({
    syaml: path.join(__dirname, 'fixtures', 'tracker-app-success', 's.yaml'),
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

test.only('execCommand test tracker error', async () => {
  const res = await execCommand({
    syaml: path.join(__dirname, 'fixtures', 'tracker-app-error', 's.yaml'),
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
