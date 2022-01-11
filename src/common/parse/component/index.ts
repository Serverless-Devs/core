import { IComponentConfig, IProjectConfig } from '../interface';
import { getRootHome } from '../../../libs/common';
import path from 'path';
import getYamlContent from '../../getYamlContent';
import { getCredential } from '../../credential';
import { getActions } from '../utils';
import Hook from './hook';

class ComponentExec {
  private projectConfig: IProjectConfig;
  private method: string;
  protected hook: Hook;

  constructor(config: IComponentConfig) {
    this.projectConfig = config.projectConfig;
    this.method = config.method;
  }
  async handleCredentials() {
    const accessPath = path.join(getRootHome(), 'access.yaml');
    const data = await getYamlContent(accessPath);
    if (data[this.projectConfig.access]) {
      this.projectConfig.credentials = await getCredential();
    }
  }
  async init() {
    await this.handleCredentials();
    const actions = getActions(this.projectConfig, this.method);
    this.hook = new Hook(actions);
  }
}

export default ComponentExec;
