const firstUpperCase = (str: string) => str?.toString().replace(/^( |^)[a-z]/g, (L) => L.toUpperCase())

export default class FormattedOutput {
  public get(type: string, details: string) {
    // E.g.: Getting domain: todolist.todolist.*****.cn-hangzhou.fc.devsapp.net
    return `Getting ${type}: ${details}`;
  }

  public set(type: string, details: string) {
    // E.g.: Setting domain: todolist.todolist.*****.cn-hangzhou.fc.devsapp.net
    return `Setting ${type}: ${details}`;
  }

  public create(type: string, details: string) {
    // E.g.: Creating serivce: my-test-service
    return `Creating ${type}: ${details}`;
  }

  public update(type: string, details: string) {
    // E.g.: Updating function: my-test-function
    return `Updating ${type}: ${details}`;
  }

  public remove(type: string, details: string) {
    // E.g.: Removing function: my-test-function
    return `Removing ${type}: ${details}`;
  }

  public warn(type: string, details: string, description?: string) {
    // E.g.:
    // Reminder customDomain: default is auto
    // Reminder deploy type: sdk (Switch command [s cli fc-default set deploy-type pulumi])
    return `Reminder ${type}: ${details}${description ? `(${description})` : ''}`;
  }

  public nextStep(step: string[]) {
    // E.g.:
    //   Tips for next step:
    //     * Invoke remote function: s invoke
    //     * Remove service: s remove service
    return `\nTips for next step:${step.map(item => `\n* ${item}`)}\n`;
  }

  public using(type: string, details: string) {
    // E.g.: Using region: cn-hangzhou
    return `Using ${type}: ${details}`;
  }

  public check(type: string, details: string) {
    // E.g.: Checking Serivce my-service exists
    return `Checking ${firstUpperCase(type)} ${details} exists`;
  }

  public retry(type: string, action: string, details: string, times?: number) {
    // E.g.: 
    // Retrying function: create myfunction
    // Retrying function: create myfunction, retry 1 time
    return `Retrying ${type}: ${action} ${details}${times ? `, retry ${times} time` : ''}`;
  }
}
