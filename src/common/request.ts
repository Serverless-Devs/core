import download from 'download';
import got, { Method } from 'got';
import spinner, { Ora } from './spinner';
import decompress from 'decompress';
import { logger } from '../libs/utils';
import report from '../common/report';
import rimraf from 'rimraf';
import path from 'path';
interface HintOptions {
  loading?: string;
  success?: string;
  error?: string;
}
interface RequestOptions {
  method?: Method;
  body?: object;
  params?: object;
  hint?: HintOptions;
  ignoreError?: boolean;
  [key: string]: any;
}

interface IErrorConfig {
  requestUrl: string;
  statusCode: string | number;
  errorMsg: string;
}

export function reportError(config: IErrorConfig) {
  report({
    type: 'networkError',
    content: `${config.requestUrl}||${config.statusCode}||${config.errorMsg}`,
  });
}

export interface IDownloadOptions {
  extract?: boolean;
  filename?: string;
  strip?: number;
}

export async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const errorMessage = (code: string | number, message: string) =>
    `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${message}\n, Code: ${code}`;
  const {
    method = 'get',
    params,
    body: bodyFromOptions,
    hint = {},
    ignoreError = false,
    ...rest
  } = options;
  const { loading, success, error } = hint;
  let spin: Ora;
  if (loading) {
    spin = spinner(loading);
  }
  const isGet = method.toUpperCase() === 'GET';

  try {
    logger.debug(`URL: ${url}`);
    const result: any = await got(url, {
      method,
      [isGet ? 'query' : 'body']: isGet ? params : bodyFromOptions,
      ...rest,
      https: {
        rejectUnauthorized: false,
      },
    }).json();
    spin?.stop();
    success && spinner(success).succeed();
    return result.Response || result;
  } catch (e) {
    spin?.stop();
    if (!ignoreError) {
      error && spinner(error).fail();
      reportError({
        requestUrl: url,
        statusCode: e.code,
        errorMsg: e.message,
      });
      throw new Error(errorMessage(e.statusCode, e.message));
    }
  }
}

export async function downloadRequest(url: string, dest: string, options: IDownloadOptions = {}) {
  const { extract, strip, filename } = options;
  const spin = spinner(`start downloading: ${url}`);
  if (extract) {
    return await downloadWithExtract({ url, dest, filename, strip, spin });
  }
  await downloadWithNoExtract({ url, dest, filename, spin });
}

async function downloadWithExtract({ url, dest, filename, strip, spin }) {
  try {
    const formatFilename = filename || 'demo.zip';
    const options = { filename: formatFilename, rejectUnauthorized: false };
    await download(url, dest, options);
    spin.text = filename ? `${filename} file unzipping...` : 'file unzipping...';
    rimraf.sync(path.resolve(dest, '.git'));
    try {
      await decompress(`${dest}/${formatFilename}`, dest, { strip });
    } catch (error) {
      await decompress(`${dest}/${formatFilename}`, dest, { strip });
      reportError({
        requestUrl: url,
        statusCode: error.code,
        errorMsg: error.message,
      });
    }
    rimraf.sync(`${dest}/${formatFilename}`);
    const text = 'file decompression completed';
    spin.succeed(filename ? `${filename} ${text}` : text);
  } catch (error) {
    spin.stop();
    reportError({
      requestUrl: url,
      statusCode: error.code,
      errorMsg: error.message,
    });
    throw error;
  }
}

async function downloadWithNoExtract({ url, dest, filename, spin }) {
  const options = { filename, rejectUnauthorized: false };
  await download(url, dest, options);
  spin.succeed(`download success: ${url}`);
}
