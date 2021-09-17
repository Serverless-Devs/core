import report from './report';
import { execDaemon } from '../execDaemon';

export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

async function reportComponent(componentName: string, options: IReportComponent) {
  execDaemon('reportComponent.js', {
    componentName,
    componentConfig: JSON.stringify(options),
  });
  report({
    type: 'action',
    content: `${componentName}|${JSON.stringify(options)}`,
  });
}

export default reportComponent;
