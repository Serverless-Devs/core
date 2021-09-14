import { execDaemon } from '../execDaemon';

interface IConfig {
  type: 'pv' | 'error' | 'action';
  content?: string;
}

function report(config: IConfig) {
  execDaemon('report.js', config);
}

export default report;
