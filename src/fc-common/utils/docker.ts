import { execSync } from 'child_process';

export function getDockerInfo(): any {
  const execRes = execSync('docker info --format \"{{json .}}\"');
  const dockerInfo = JSON.parse(execRes.toString());
  return dockerInfo;
}
