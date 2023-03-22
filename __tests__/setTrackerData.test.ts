import { setTrackerData, getPid, getRootHome } from '../src';
import fs from 'fs-extra';
import path from 'path';

test('setTrackerData', () => {
  const traceId = `${getPid()}${Date.now()}`;
  process.env['serverless_devs_trace_id'] = traceId;
  const tracePath = path.join(getRootHome(), '.s', 'config', `${traceId}.json`);
  fs.ensureFileSync(tracePath);
  fs.writeFileSync(tracePath, '{}');
  const dataA = {
    uid: '1920014488718015',
    region: 'cn-hangzhou',
    name: 'start-egg',
    service: 'web-framework',
  };
  const component = 'fc';
  setTrackerData(component, dataA);
  const dataB = {
    uid: '1920014488718015',
    region: 'cn-hangzhou',
    name: 'start-egg-2',
    service: 'web-framework',
  };
  setTrackerData(component, dataB);
  expect(fs.readJSONSync(tracePath)).toEqual({ [component]: [dataA, dataB] });
});
