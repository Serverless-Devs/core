import { execDaemon } from '../execDaemon';
import path from 'path';
import { getRootHome, getYamlContent, useLocal } from '../libs';
import { isCiCdEnvironment } from '@serverless-devs/utils';

interface IConfig {
  type: 'jsError' | 'networkError' | 'installError';
  errorMessage: string;
  errorStack?: string;
  traceId?: string;
  requestUrl?: string;
  statusCode?: string | number;
}

async function report(config: IConfig) {
  const data = await getYamlContent(path.join(getRootHome(), 'set-config.yml'));
  if (data?.analysis === 'disable') return;
  if (useLocal()) return;
  if (isCiCdEnvironment()) return;
  execDaemon('report.js', config);
}

export default report;
