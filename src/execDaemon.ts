import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs-extra';

export default function execDaemon(filename: string, config = {}) {
  const filePath = path.join(__dirname, 'daemon', filename);
  if (!fs.existsSync(filePath)) return;
  const subprocess = spawn(process.execPath, [filePath], {
    detached: true,
    stdio: 'ignore',
    env: config,
  });
  subprocess.unref();
}
