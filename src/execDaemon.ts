import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import { readJsonFile } from './libs/utils';
const TTL = 5 * 60 * 1000;

interface IConfig {
  lockPath: string;
  [key: string]: string;
}

export default function execDaemon(filename: string, config: IConfig) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  const { lockPath } = config;
  const lockFileInfo = readJsonFile(lockPath);
  const now = Date.now();
  if (now - lockFileInfo.currentTimestamp < TTL) return;
  fs.writeFileSync(lockPath, JSON.stringify({ ...lockFileInfo, currentTimestamp: now }, null, 2));
  const subprocess = spawn(process.execPath, [filePath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...config },
  });
  subprocess.unref();
}
