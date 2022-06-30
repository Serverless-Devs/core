import { execDaemon } from '../execDaemon';
import path from 'path';
import { getRootHome, getYamlContent, useLocal } from '../libs';

interface IConfig {
  type: 'pv' | 'action' | 'jsError' | 'networkError' | 'initTemplate' | 'installError';
  content?: string;
  traceId?: string;
}

async function report(config: IConfig) {
  const data = await getYamlContent(path.join(getRootHome(), 'set-config.yml'));
  if (data?.analysis === 'disable') return;
  if (useLocal()) return;
  execDaemon('report.js', config);
}

export default report;
