export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

async function reportComponent(componentName: string, options: IReportComponent) {
  // 组件不在进行上报，暂时将此方法置空
}

export default reportComponent;
