import { loadComponent } from '../../common/load';
import logger from '../common/logger';

export async function getEndpointFromFcDefault(): Promise<string | null> {
  const fcDefault = await loadComponent('devsapp/fc-default');
  const fcEndpoint: string = await fcDefault.get({ args: 'fc-endpoint' });
  if (!fcEndpoint) { return null; }
  const enableFcEndpoint: any = await fcDefault.get({ args: 'enable-fc-endpoint' });
  return (enableFcEndpoint === true || enableFcEndpoint === 'true') ? fcEndpoint : null;
}

export function checkEndpoint(region: string, accountId: string, endpoint: string): boolean {
  // 用户设置自定义 endpoint ，只有 https://${accountID}.${region}-internal.fc.aliyuncs.com 这一种格式
  if (endpoint.endsWith('-internal.fc.aliyuncs.com')) {
    const accountIdInEndpoint: string = extractAccountId(endpoint);
    const regionInEndpoint: string = extractRegion(endpoint);
    if (accountIdInEndpoint !== accountId) {
      logger.error(`Please make accountId: ${accountIdInEndpoint} in custom endpoint equal to accountId: ${accountId} you provided.`);
      return false;
    }
    if (!regionInEndpoint.startsWith(region)) {
      logger.error(`Please make region: ${regionInEndpoint} in custom endpoint equal to accountId: ${region} you provided.`);
      return false;
    }
  }
  return true;
}


export function extractAccountId(endpoint: string): string | null {
  return extract(/^https?:\/\/([^.]+)\..+$/, endpoint);
}

export function extractRegion(endpoint: string): string | null {
  return extract(/^https?:\/\/[^.]+\.([^.]+)\..+$/, endpoint);
}

function extract(regex: RegExp, endpoint: string): any {
  const matchs = endpoint.match(regex);
  if (matchs) {
    return matchs[1];
  }
  return null;
}
