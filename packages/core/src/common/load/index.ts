import fs from 'fs-extra';
import { S_ROOT_HOME_COMPONENT } from '../../libs/common';
import {
  buildComponentInstance,
  downloadComponent,
  generateComponentPath,
  IComponentPath,
  installDependency,
} from './service';

/**
 * @description 主要的方法，用于load组件。
 * 组件会下载到 ~/.s/components 目录下面
 * @componentName: 组件名, 默认load最新版本组件，支持load某个版本组件load@0.11
 * @provider: SERVERLESS厂商
 */

async function load(componentName: string, provider: string) {
  const [name, version] = componentName.split('@');
  const baseArgs = { name, version, provider };
  const componentPaths: IComponentPath = await generateComponentPath(
    baseArgs,
    S_ROOT_HOME_COMPONENT,
  );
  const { componentPath, lockPath } = componentPaths;
  // 通过是否存在 .s.lock文件来判断
  if (!fs.existsSync(lockPath)) {
    await downloadComponent(componentPath, baseArgs);
    await installDependency(baseArgs.name, componentPaths);
  }
  return await buildComponentInstance(componentPath);
}

export default load;
