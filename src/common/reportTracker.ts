import { execDaemon } from '../execDaemon';
import path from 'path';
import { getRootHome, getYamlContent, useLocal, isCiCdEnv } from '../libs';

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
  if (isCiCdEnv()) return;
  execDaemon('reportTracker.js', config);
}

export default reportTracker;
