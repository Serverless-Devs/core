import download, { DownloadOptions as MyDownloadOptions } from 'download';
import fetch, { RequestInit, Response } from 'node-fetch';
import { ProgressService, ProgressType, ProgressBarOptions } from '@serverless-devs/s-progress-bar';
import { green } from 'colors';
import spinner from './spinner';
import { Logger } from '../logger';
import decompress from 'decompress';
import fs from 'fs-extra';
import i18n from '../libs/i18n';

interface HintOptions {
  loading?: string;
  success?: string;
  error?: string;
}
interface RequestOptions {
  body?: object | string;
  params?: object;
  hint?: HintOptions;
  // whatwg/fetch standard options
  headers?: RequestInit['headers'];
  method?: string;
  redirect?: RequestInit['redirect'];
  signal?: RequestInit['signal'];
  // node-fetch extensions
  agent?: RequestInit['agent'];
  compress?: boolean; // =true support gzip/deflate content encoding. false to disable
  follow?: number; // =20 maximum redirect count. 0 to not follow redirect
  size?: number; // =0 maximum response body size in bytes. 0 to disable
  timeout?: number; // =0 req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
  // node-fetch does not support mode, cache or credentials options
}

export type DownloadOptions = MyDownloadOptions;

function formatPost({ body, rest }) {
  let formatbody: any;
  let contentType: string;
  if (typeof body === 'string') {
    formatbody = body;
  } else {
    contentType = rest?.headers?.['Content-Type'];
    if (!contentType || contentType.includes('application/json')) {
      contentType = 'application/json; charset=utf-8';
      formatbody = JSON.stringify(body);
    } else if (contentType.includes('x-www-form-urlencoded')) {
      contentType = 'application/x-www-form-urlencoded; charset=utf-8';
      formatbody = new URLSearchParams();
      Object.keys(body).forEach((key) => formatbody.append(key, body[key]));
    }
  }
  return { formatbody, contentType };
}

export async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const { hint = {}, method = 'get', params, body, ...rest } = options;
  let fun: Promise<Response>;
  if (method.toUpperCase() === 'GET') {
    let formatUrl = url;
    if (params) {
      const searchParams = new URLSearchParams({ ...params });
      formatUrl = `${url}?${searchParams}`;
    }
    fun = fetch(formatUrl, rest);
  } else {
    const { formatbody, contentType } = formatPost({ body, rest });
    fun = fetch(url, {
      method: 'POST',
      body: formatbody,
      headers: { 'Content-Type': contentType },
      ...rest,
    });
  }
  const { loading, success, error } = hint;
  let vm: any;
  if (loading) {
    vm = spinner(loading);
  }

  try {
    const response = await fun;
    loading && vm.stop();
    success && spinner(success).succeed();
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType.includes('text/html')) {
        return response.text();
      } else if (contentType.includes('application/json')) {
        const data: any = await response.json();
        return data.Response || data;
      } else {
        return response;
      }
    } else {
      error && spinner(error).fail();
      throw new Error(
        `Url:${url}\n,params: ${JSON.stringify(options)}\n, Code: ${response.status}`,
      );
    }
  } catch (e) {
    loading && vm.stop();
    spinner(e.message).fail();
    throw new Error(
      `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${e.message}\n`,
    );
  }
}

export async function downloadRequest(url, dest, options: MyDownloadOptions = {}) {
  const { extract, strip, ...rest } = options;
  Logger.log('prepare downloading');
  let len: number;
  try {
    const { headers } = await fetch(url);
    len = parseInt(headers.get('content-length'), 10);
  } catch (e) {
    throw new Error(e.message);
  }

  let bar: ProgressService;
  if (len) {
    const pbo: ProgressBarOptions = { total: len };
    bar = new ProgressService(ProgressType.Bar, pbo);
  } else {
    const pbo: ProgressBarOptions = {
      total: 120,
      width: 30,
    };
    const format = `((:bar)) ${green(':loading')} ${green('downloading')} `;
    bar = new ProgressService(ProgressType.Loading, pbo, format);
  }
  Logger.log('start downloading');

  await download(url, dest, rest).on('downloadProgress', (progress) => {
    bar.update(progress.transferred);
  });
  bar.terminate();
  Logger.log('download success');

  if (extract) {
    const files = fs.readdirSync(dest);
    const filename = files.find((item) => url.includes(item));
    const vm = spinner(i18n.__('File unzipping...'));
    await decompress(`${dest}/${filename}`, dest, { strip });
    await fs.unlink(`${dest}/${filename}`);
    vm.succeed(i18n.__('File decompression completed'));
  }
}
