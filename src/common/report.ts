import { execDaemon } from '../execDaemon';

interface IConfig {
  type: 'pv' | 'action' | 'jsError' | 'networkError';
  content?: string;
}

function report(config: IConfig) {
  execDaemon('report.js', config);
}

export default report;
