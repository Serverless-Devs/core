import { execDaemon } from '../execDaemon';

export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

export async function reportComponent(componentName: string, options: IReportComponent) {
  execDaemon('reportComponent.js', {
    componentName,
    componentConfig: JSON.stringify(options),
  });
}
