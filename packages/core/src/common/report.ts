import { request } from './request';
import { Logger } from '../logger/index';

export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

export async function reportComponent(componentName: string, options: IReportComponent) {
  try {
    await request('https://registry.serverlessfans.cn/report/component', {
      method: 'post',
      form: true,
      body: {
        component: componentName,
        ...options,
      },
    });
  } catch (error) {
    Logger.debug('S_CORE', error);
  }
}
