import download, { DownloadOptions as MyDownloadOptions } from 'download';
import got from 'got';
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
export interface requestOptions {
  method?: 'get' | 'post';
  data?: object;
  json?: boolean;
  hint?: HintOptions;
}

export type DownloadOptions = MyDownloadOptions;

enum METHOD_ENUM {
  get = 'query',
  post = 'body',
}

export async function request(url: string, options?: requestOptions): Promise<any> {
  // @ts-ignore
  const { method = 'get', data, json, hint = {} } = options || {};
  const { loading, success, error } = hint;
  let vm = null;
  let result = null;
  const errorMessage = (code: string | number, message: string) =>
    `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${message}\n, Code: ${code}`;
  loading && (vm = spinner(loading));

  try {
    result = await got(url, {
      method: method.toUpperCase(),
      [METHOD_ENUM[method]]: data,
      json: json || true,
    });
    loading && vm.stop();
  } catch (e) {
    loading && vm.stop();
    spinner(e.message).fail();
    throw new Error(errorMessage(e.statusCode, e.message));
  }

  const { statusCode, body }: { statusCode: number; body: any } = result;

  if (statusCode !== 200) {
    error && spinner(error).fail();
    throw new Error(errorMessage(statusCode, '系统异常'));
  } else if (body.Error) {
    error && spinner(error).fail();
    throw new Error(errorMessage(body.Error.Code, body.Error.Message));
  }

  success && spinner(success).succeed();
  return body.Response;
}

export async function downloadRequest(url, dest, options?: MyDownloadOptions) {
  const { extract, strip, ...rest } = options || {};
  Logger.log('prepare downloading');
  let len;
  try {
    const { headers } = await got(url, { method: 'HEAD' });
    len = parseInt(headers['content-length'], 10);
  } catch (err) {
    // ignore error
  }

  let bar;
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
