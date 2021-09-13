import { execDaemon } from '../execDaemon';

interface IConfig {
  type: 'pv' | 'error';
}

function report(config: IConfig) {
  const { type } = config;
  execDaemon('report.js', {
    type,
  });
}

export default report;
