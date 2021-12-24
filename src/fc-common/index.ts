import logger from './common/logger';
import { ICredentials, InputProps } from './common/entity';
import { getCredential } from '../common/credential';
import * as _ from 'lodash';
import FC from '@alicloud/fc2';
import { checkEndpoint, getEndpointFromFcDefault } from './utils/endpoint';
import { getDockerInfo } from './utils/docker';
import { bytesToSize } from './utils/utils';
import * as fs from 'fs';
import { execSync } from 'child_process';
import commandExists from 'command-exists';
import os from 'os';
import path from 'path';
import './utils/fc-client';
import { getRootHome } from '../libs/common';

const DEFAULT_TIMEOUT = 600 * 1000;

const FcCommonComponent = {
  defaultConfigFile: path.join(getRootHome(), '.fc.default.yaml'),
  /**
   * 获取 fc client
   * @param {InputProps} inputs
   * @returns
   */
  async makeFcClient(inputs: InputProps) {
    logger.debug(`input: ${JSON.stringify(inputs.props)}`);
    const region: string = inputs?.props?.region;
    const timeout: number = inputs?.props?.timeout;
    if (!region) {
      logger.error('Please provide region in your props.');
      return;
    }
    const { credentials } = await this.getCredentials(inputs);

    const endpointFromCredentials: string = credentials.endpoint;
    const endpointFromFcDefault: string = await getEndpointFromFcDefault();

    let endpoint: string = null;
    if (endpointFromCredentials) {
      // 优先使用 credentials 中的 endpoint
      if (!checkEndpoint(region, credentials?.AccountID, endpointFromCredentials)) {
        return;
      }
      endpoint = endpointFromCredentials;
    } else if (endpointFromFcDefault) {
      if (!checkEndpoint(region, credentials?.AccountID, endpointFromFcDefault)) {
        return;
      }
      endpoint = endpointFromFcDefault;
    }
    if (endpoint) {
      logger.info(`Using endpoint ${endpoint}`);
    }
    return new FC(credentials.AccountID, {
      accessKeyID: credentials.AccessKeyID,
      accessKeySecret: credentials.AccessKeySecret,
      securityToken: credentials.SecurityToken,
      region,
      timeout: timeout * 1000 || DEFAULT_TIMEOUT,
      endpoint,
    });
  },

  /**
   * 获取 credentials 值
   * @param {InputProps} inputs
   * @returns {ICredentials}
   */
  async getCredentials(inputs: InputProps): Promise<{ access: string; credentials: ICredentials }> {
    if (!_.isEmpty(inputs?.credentials)) {
      return {
        access: inputs?.project?.access,
        credentials: inputs.credentials,
      };
    }
    const res: any = await getCredential(inputs?.project?.access);
    const credentials: ICredentials = {
      AccountID: res?.AccountID,
      AccessKeyID: res?.AccessKeyID,
      AccessKeySecret: res?.AccessKeySecret,
      endpoint: res?.endpoing,
    };
    return {
      access: res?.Alias,
      credentials,
    };
  },

  /**
   * 生成容器资源限制配置
   * @param memorySize 内存大小
   * @returns HostConfig define by DockerEngineAPI
   */
  async genContainerResourcesLimitConfig(memorySize: number): Promise<any> {
    // memorySize = memorySize.props.memorySize; // for test

    if (memorySize < 128) {
      logger.error(`ContainerMemory is too small (min: 128, actual: '${memorySize}').`);
      return;
    } else if (memorySize < 3072 && memorySize % 64 !== 0) {
      logger.error(`ContainerMemory is set to an invalid value. The value must be a multiple of 64 MB. (actual: '${memorySize}').`);
      return;
    } else if (memorySize > 3072 && ![4096, 8192, 16384, 32768].includes(memorySize)) {
      logger.error(`Memory is set to an invalid value (allowed: 4096 | 8192 | 16384 | 32768, actual: '${memorySize}').`);
      return;
    }

    const dockerInfo = getDockerInfo();
    const { NCPU, MemTotal } = dockerInfo;
    const isWin: boolean = process.platform === 'win32';
    const memoryCoreRatio: number = memorySize > 3072 ? 1 / 2048 : 2 / 3072; // 内存核心比，弹性实例2C/3G，性能实例1C/2G

    const cpuPeriod = 6400;
    let cpuQuota: number = Math.ceil(cpuPeriod * memoryCoreRatio * memorySize);
    cpuQuota = Math.min(cpuQuota, cpuPeriod * NCPU); // 最高不超过限制
    cpuQuota = Math.max(cpuQuota, cpuPeriod); // 按照内存分配cpu配额时, 最低为100%，即1Core

    let memory = memorySize * 1024 * 1024; // bytes
    if (memory > MemTotal) {
      memory = MemTotal;
      logger.warning(`The memory config exceeds the docker limit. The memory actually allocated: ${bytesToSize(memory)}.
Now the limit of RAM resource is ${MemTotal} bytes. To improve the limit, please refer: https://docs.docker.com/desktop/${
  isWin ? 'windows' : 'mac'
}/#resources.`);
    }

    const ulimits: any = [
      { Name: 'nofile', Soft: 1024, Hard: 1024 },
      { Name: 'nproc', Soft: 1024, Hard: 1024 },
    ];

    return {
      CpuPeriod: cpuPeriod,
      CpuQuota: cpuQuota,
      Memory: memory,
      Ulimits: ulimits,
    };
  },

  /**
   * 检查环境是否安装python，java，nodejs等语言环境
   * @param {string} runtime
   * @returns {[result, details]}
   */
  async checkLanguage(runtime: string): Promise<[boolean, string]> {
    let result = true;
    let details = '';

    if (runtime.includes('python')) {
      if (!commandExists('pip')) {
        result = false;
        details += '- pip not installed.\n';
      } else {
        details += `- ${ execSync('pip --version').toString()}`;
      }

      if (!commandExists(runtime)) {
        result = false;
        details += `- ${ runtime } not installed.\n`;
      } else {
        details += `- python ${ execSync(`${runtime } -c "import platform; print(platform.python_version())"`).toString().trim()}`;
      }
    }

    if (runtime.includes('java')) {
      if (!commandExists('mvn')) {
        result = false;
        details += '- maven not installed.\n';
      } else {
        details += `- ${ execSync('mvn --version').toString().split('\n')[0].replace(/\x1b|\[m|\[1m/g, '') }\n`;
      }

      if (!commandExists('java')) {
        result = false;
        details += `- ${ runtime } not installed.\n`;
      } else {
        const javaCode = 'class test {public static void main(String args[]) {System.out.print(Double.parseDouble(System.getProperty("java.specification.version")));}}';
        const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'foo-'));
        const javaSourceFilePath = path.join(folder, 'test.java');
        const javaClassFilePath = path.join(folder, 'test.class');
        fs.writeFileSync(javaSourceFilePath, javaCode);
        const version = execSync(`javac ${ javaSourceFilePath } && java -classpath ${ folder } test`).toString();
        if (runtime.match(`java${ version.split('.')[0]}`)) {
          details += `- java ${ version}`;
        } else {
          details += `Required ${ runtime }, found java ${ version}`;
        }
        fs.unlinkSync(javaClassFilePath);
        fs.unlinkSync(javaSourceFilePath);
      }
    }

    if (runtime.includes('node')) {
      let version = '';
      if (!commandExists('node')) {
        result = false;
        details += `${runtime } not installed.\n`;
      } else {
        version = execSync('node -v').toString().trim();
        const num = runtime.replace('nodejs', '');
        if (!version.match(new RegExp(`v${num}.`))) {
          result = false;
          details += `Required ${ runtime }, found ${ version }\n`;
        } else {
          details += `- nodejs: ${ version}`;
        }
      }
    }

    return [result, details];
  },

  /**
   * 检查环境是否安装docker环境
   * @param {InputProps} inputs
   * @returns {[result, details]}
   */
  async checkDocker(): Promise<[boolean, string]> {
    let result = true;
    let details = '';
    if (!commandExists('docker')) {
      result = false;
      details += 'Docker not installed.\n';
    } else {
      details += 'Docker installed.\n';
    }
    return [result, details];
  },
}

export default FcCommonComponent;