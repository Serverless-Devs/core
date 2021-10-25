import download from 'download';
import got from 'got';
import { ProgressService, ProgressType } from '@serverless-devs/s-progress-bar';
import { green } from 'chalk';
import spinner from './spinner';
import decompress from 'decompress';
import fs from 'fs-extra';
import { RegistryEnum } from './constant';
import { logger, isCICDEnv } from '../libs/utils';
import report from '../common/report';
import rimraf from 'rimraf';
import path from 'path';

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
  /**
   * If set to true, try extracting the file using decompress.
   */
  extract?: boolean;
  /**
   * Name of the saved file.
   */
  filename?: string;
  /**
   * Proxy endpoint
   */
  proxy?: string;
  /**
   * Request Headers
   */
  headers?: {
    [name: string]: string;
  };
  /**
   * Filter out files before extracting
   */
  filter?: any;
  /**
   * Map files before extracting
   */
  map?: any;
  /**
   * Array of plugins to use.
   * Default: [decompressTar(), decompressTarbz2(), decompressTargz(), decompressUnzip()]
   */
  plugins?: any[];
  /**
   * Remove leading directory components from extracted files.
   * Default: 0
   */
  strip?: number;
  body?: string | Buffer;
  postfix?: string;
}

export async function request(url: string, options?: RequestOptions): Promise<any> {
  const {
    method = 'get',
    params,
    body: bodyFromOptions,
    hint = {},
    json = true,
    ignoreError = false,
    ...rest
  } = options || {};
  const { loading, success, error } = hint;
  let vm = null;
  let result = null;
  const errorMessage = (code: string | number, message: string) =>
    `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${message}\n, Code: ${code}`;
  loading && (vm = spinner(loading));

  try {
    const isGet = method.toUpperCase() === 'GET';
    logger.debug(`URL: ${url}`);
    result = await got(url, {
      method,
      [isGet ? 'query' : 'body']: isGet ? params : bodyFromOptions,
      json,
      ...rest,
      rejectUnauthorized: false,
    });
    loading && vm.stop();
  } catch (e) {
    loading && vm.stop();
    if (!ignoreError) {
      spinner(e.message).fail();
      reportError({
        requestUrl: url,
        statusCode: e.statusCode,
        errorMsg: e.message,
      });
      throw new Error(errorMessage(e.statusCode, e.message));
    }
  }

  const { statusCode, body }: { statusCode: number; body: any } = result;

  if (statusCode !== 200) {
    error && spinner(error).fail();
    if (!ignoreError) {
      reportError({
        requestUrl: url,
        statusCode,
        errorMsg: 'System exception',
      });
      throw new Error(errorMessage(statusCode, 'System exception'));
    }
  } else if (body.Error) {
    error && spinner(error).fail();
    if (!ignoreError) {
      reportError({
        requestUrl: url,
        statusCode: body.Error.Code,
        errorMsg: body.Error.Message,
      });
      throw new Error(errorMessage(body.Error.Code, body.Error.Message));
    }
  }

  success && spinner(success).succeed();
  return body.Response || body;
}

export async function downloadRequest(url: string, dest: string, options?: IDownloadOptions) {
  const { extract, postfix, strip, filename, ...rest } = options || {};
  const spin = spinner(`prepare downloading: ${url}`);
  const bar = await getProgressBar({ url, filename });
  spin.text = `start downloading: ${url}`;
  if (extract) {
    return await downloadWithExtract({ url, dest, filename, strip, rest, bar, spin });
  }
  await downloadWithNoExtract({ url, dest, filename, rest, bar, spin });
}

async function downloadWithExtract({ url, dest, filename, strip, rest, bar, spin }) {
  try {
    const formatFilename = filename || 'demo.zip';
    const options = { ...rest, filename: formatFilename, rejectUnauthorized: false };
    await download(url, dest, options).on('downloadProgress', (progress) => {
      spin.stop();
      bar.update(progress.transferred);
    });
    bar.terminate();
    spin.start(filename ? `${filename} file unzipping...` : 'file unzipping...');
    rimraf.sync(path.resolve(dest, '.git'));
    await decompress(`${dest}/${formatFilename}`, dest, { strip });
    await fs.unlink(`${dest}/${formatFilename}`);
    const text = 'file decompression completed';
    spin.succeed(filename ? `${filename} ${text}` : text);
  } catch (error) {
    spin.stop();
    reportError({
      requestUrl: url,
      statusCode: error.statusCode,
      errorMsg: error.message,
    });
    throw error;
  }
}

async function downloadWithNoExtract({ url, dest, filename, rest, bar, spin }) {
  const options = { ...rest, filename, rejectUnauthorized: false };
  await download(url, dest, options).on('downloadProgress', (progress) => {
    spin.stop();
    bar.update(progress.transferred);
  });
  bar.terminate();
  spin.succeed(`download success: ${url}`);
}

async function getContentLength(url: string) {
  if (isCICDEnv()) return 0;
  if (url.startsWith(RegistryEnum.serverless) || url.startsWith(RegistryEnum.serverlessOld)) {
    try {
      const { headers } = await got(url, {
        method: 'HEAD',
        timeout: 3000,
      });
      return parseInt(headers['content-length'], 10);
    } catch (error) {
      return 0;
    }
  }
}

async function getProgressBar({ url, filename }) {
  const len: number = await getContentLength(url);
  if (len) {
    return new ProgressService(ProgressType.Bar, { total: len });
  }
  const text = `${green(':loading')} ${green('downloading')} `;
  const format = filename ? `${text}${filename} ` : text;
  return new ProgressService(ProgressType.Loading, { total: 100 }, format);
}
