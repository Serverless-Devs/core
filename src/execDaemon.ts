import path from 'path';
import { spawn } from 'child_process';
import { useLocal } from './libs';
import { isCiCdEnvironment } from '@serverless-devs/utils';
import fs from 'fs-extra';
import { get } from 'lodash';
const TTL = 10 * 60 * 1000;

interface IConfig {
  [key: string]: any;
}
interface IConfigWithTTL extends IConfig {
  lockPath: string;
}

function readJsonFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
}

export function execDaemon(filename: string, config?: IConfig) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  const core_use_daemon = get(process, 'env.core_use_daemon', 'true');
  if (core_use_daemon === 'true') {
    const subprocess = spawn(process.execPath, [filePath], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ...config },
    });
    return subprocess.unref();
  }
  spawn(process.execPath, [filePath], {
    stdio: 'inherit',
    env: { ...process.env, ...config },
  });
}

export function execDaemonWithTTL(filename: string, config: IConfigWithTTL) {
  if (useLocal()) return;
  if (isCiCdEnvironment()) return;
  const { lockPath } = config;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (now - lockFileInfo?.currentTimestamp < TTL) return;
  fs.writeFileSync(lockPath, JSON.stringify({ ...lockFileInfo, currentTimestamp: now }, null, 2));
  execDaemon(filename, config);
}
