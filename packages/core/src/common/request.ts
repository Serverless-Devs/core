import download, { DownloadOptions as MyDownloadOptions } from 'download';
import got from 'got';
import { ProgressService, ProgressType } from '@serverless-devs/s-progress-bar';
import { green } from 'colors';
import spinner from './spinner';
import decompress from 'decompress';
import fs from 'fs-extra';
import i18n from '../libs/i18n';

interface HintOptions {
  loading?: string;
  success?: string;
  error?: string;
}
interface RequestOptions {
  method?: string;
  body?: object;
  params?: object;
  hint?: HintOptions;
  [key: string]: any;
}

export type DownloadOptions = MyDownloadOptions;

export async function request(url: string, options?: RequestOptions): Promise<any> {
  const { method = 'get', params, body: bodyFromOptions, hint = {}, json = true, ...rest } =
    options || {};
  const { loading, success, error } = hint;
  let vm = null;
  let result = null;
  const errorMessage = (code: string | number, message: string) =>
    `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${message}\n, Code: ${code}`;
  loading && (vm = spinner(loading));

  try {
    const isGet = method.toUpperCase() === 'GET';
    result = await got(url, {
      method,
      [isGet ? 'query' : 'body']: isGet ? params : bodyFromOptions,
      json,
      ...rest,
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
    throw new Error(errorMessage(statusCode, i18n.__('System exception')));
  } else if (body.Error) {
    error && spinner(error).fail();
    throw new Error(errorMessage(body.Error.Code, body.Error.Message));
  }

  success && spinner(success).succeed();
  return body.Response;
}

export async function downloadRequest(url: string, dest: string, options?: MyDownloadOptions) {
  const { extract, strip, ...rest } = options || {};
  const spin = spinner('prepare downloading');
  let len: number;
  try {
    const { headers } = await got(url, { method: 'HEAD' });
    len = parseInt(headers['content-length'], 10);
  } catch (err) {
    // ignore error
  }

  let bar: ProgressService;
  if (len) {
    bar = new ProgressService(ProgressType.Bar, { total: len });
  } else {
    const format = `${green(':loading')} ${green('downloading')} `;
    bar = new ProgressService(ProgressType.Loading, { total: 100 }, format);
  }
  spin.text = 'start downloading';
  await download(url, dest, rest).on('downloadProgress', (progress) => {
    spin.stop();
    bar.update(progress.transferred);
  });
  bar.terminate();
  spin.start('download success');
  if (extract) {
    const files = fs.readdirSync(dest);
    const filename = files[0];
    spin.text = i18n.__('File unzipping...');
    await decompress(`${dest}/${filename}`, dest, { strip });
    await fs.unlink(`${dest}/${filename}`);
    spin.succeed(i18n.__('File decompression completed'));
  }
}
