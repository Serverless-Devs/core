import report from './report';

export interface IReportComponent {
  uid: string;
  command: string;
  remark?: string;
}

function reportComponent(componentName: string, options: IReportComponent) {
  report({
    type: 'action',
    content: `${componentName}|${JSON.stringify(options)}`,
  });
}

export default reportComponent;
