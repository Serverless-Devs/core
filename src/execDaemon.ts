import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import execa from 'execa';
import { getConfig } from './libs';
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

export async function execAction(filename: string, args: string) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  execa.sync(`${process.execPath} ${filePath} ${args}`, {
    stdio: 'ignore',
    shell: true,
  });
  return getConfig('actionComponentArgv');
}

export function execDaemon(filename: string, config?: IConfig) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  const subprocess = spawn(process.execPath, [filePath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...config },
  });
  subprocess.unref();
}

export function execDaemonWithTTL(filename: string, config: IConfigWithTTL) {
  const { lockPath } = config;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (now - lockFileInfo?.currentTimestamp < TTL) return;
  fs.writeFileSync(lockPath, JSON.stringify({ ...lockFileInfo, currentTimestamp: now }, null, 2));
  execDaemon(filename, config);
}
