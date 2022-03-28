import path from 'path';
import { spawn, exec } from 'child_process';
import fs from 'fs-extra';
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

function onFinish(cp) {
  return new Promise((resolve) => {
    const stdout = [];
    const stderr = [];

    cp.stdout.on('data', (chunk) => {
      stdout.push(chunk);
    });

    cp.stderr.on('data', (chunk) => {
      stderr.push(chunk);
    });

    cp.on('exit', (code) => {
      resolve({
        code: code,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    });
  });
}

export async function execAction(filename: string, args: string) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  const cp = exec(`${process.execPath} ${filePath} ${args}`, {
    encoding: null,
  });
  const result: any = await onFinish(cp);
  const stdout = result.stdout.toString();
  return JSON.parse(stdout);
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
