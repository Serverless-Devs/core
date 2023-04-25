import * as subject from '../../src/libs/common';
import path from 'path';
import os from 'os';

describe('getRootHome', function () {
  test('s home not changed if CLI_VERSION env not found or lower then expected', function () {
    process.env.PIPELINE_ID = 'dummy pipeline id';
    expect(subject.getRootHome()).toBe(path.join(os.homedir(), '.s'));

    process.env.CLI_VERSION = '2.0.92';
    expect(subject.getRootHome()).toBe(path.join(os.homedir(), '.s'));
  });

  test('s home changed to /{USER_HOME}/.cache/.s/', function () {
    process.env.PIPELINE_ID = 'dummy pipeline id';
    process.env.CLI_VERSION = '2.0.93';
    expect(subject.getRootHome()).toBe(path.join(os.homedir(), '.cache', '.s'));
  });
});
