import path from 'path';
import fs from 'fs-extra';
import { isEmpty, unionWith, isEqual } from 'lodash';
import { getRootHome } from '../libs';
import { logger } from '../logger';

const setTrackerData = (componetName: string, data: Record<string, any>) => {
  logger.debug('setTrackerData start');
  logger.debug(`data: ${JSON.stringify(data)}`);
  if (isEmpty(data)) return;
  const traceId = process.env['serverless_devs_trace_id'];
  logger.debug(`traceId: ${traceId}`);
  if (isEmpty(traceId)) return;
  const tracePath = path.join(getRootHome(), 'config', `${traceId}.json`);
  logger.debug(`tracePath: ${tracePath}`);
  logger.debug(`tracePath existed: ${fs.existsSync(tracePath)}`);
  if (fs.existsSync(tracePath)) {
    const traceData = fs.readJSONSync(tracePath);
    traceData[componetName] = traceData[componetName]
      ? unionWith(traceData[componetName], [data], isEqual)
      : [data];
    logger.debug(`traceData: ${JSON.stringify(traceData)}`);
    fs.writeJSONSync(tracePath, traceData);
  }
  logger.debug('setTrackerData end');
};

export default setTrackerData;
