import { request, downloadRequest } from '../common';

export const SERVERLESS_API = 'https://tool.serverlessfans.com/api';

export interface IRemoteComponentParams {
  name: string;
  provider: string;
  type?: any;
}

/**
 *
 * @description 获取组件版本
 * @param params IRemoteComponentParams
 */
export const getComponentVersion = (params: IRemoteComponentParams) => {
  return request(`${SERVERLESS_API}/package/object/version`, {
    data: Object.assign({ type: 'component' }, params),
  });
};

/**
 * @description 获取下载链接
 * @param params IRemoteComponentParams
 */
export async function getComponentDownloadUrl(params: IRemoteComponentParams) {
  return request(`${SERVERLESS_API}/package/get/object/url`, {
    data: Object.assign({ type: 'component' }, params),
  });
}

export async function execComponentDownload(url: string, tempDir: string) {
  return downloadRequest(url, tempDir, { extract: true, strip: 1 });
}

