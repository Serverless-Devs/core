import { execDaemon } from '../execDaemon';
import path from 'path';
import { getRootHome, getYamlContent, useLocal } from '../libs';
import { isCiCdEnvironment } from '@serverless-devs/utils';

interface IConfig {
  trackerType: 'command' | 'init';
  syaml?: string;
  access?: string;
  templateName?: string;
}

async function reportTracker(config: IConfig) {
  const data = await getYamlContent(path.join(getRootHome(), 'set-config.yml'));
  if (data?.analysis === 'disable') return;
  // 私有化部署不在进行上报数据
  if (useLocal()) return;
  if (isCiCdEnvironment()) return;
  execDaemon('reportTracker.js', config);
}

export default reportTracker;
