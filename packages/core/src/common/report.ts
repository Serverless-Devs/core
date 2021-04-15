import { request } from './request';

export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

export async function reportComponent(componentName: string, options: IReportComponent) {
  console.log({ component: componentName, ...options });
  try {
    const abc = await request('https://registry.serverlessfans.cn/report/component', {
      method: 'post',
      form: true,
      body: {
        component: componentName,
        ...options,
      },
    });
    console.log(abc);
  } catch (error) {
    // ignore exception
  }
}
