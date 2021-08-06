import download from 'download';
import got from 'got';
import { ProgressService, ProgressType } from '@serverless-devs/s-progress-bar';
import { green, cyan } from 'chalk';
import spinner from './spinner';
import decompress from 'decompress';
import fs from 'fs-extra';
import path from 'path';
import { RegistryEnum } from './constant';
import { Logger } from '../logger';
const logger = new Logger('S-CORE');
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
  emptyDir?: boolean;
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
      timeout: 1500,
      ...rest,
      rejectUnauthorized: false,
    });
    loading && vm.stop();
  } catch (e) {
    loading && vm.stop();
    if (!ignoreError) {
      spinner(e.message).fail();
      throw new Error(errorMessage(e.statusCode, e.message));
    }
  }

  const { statusCode, body }: { statusCode: number; body: any } = result;

  if (statusCode !== 200) {
    error && spinner(error).fail();
    if (!ignoreError) {
      throw new Error(errorMessage(statusCode, 'System exception'));
    }
  } else if (body.Error) {
    error && spinner(error).fail();
    if (!ignoreError) {
      throw new Error(errorMessage(body.Error.Code, body.Error.Message));
    }
  }

  success && spinner(success).succeed();
  return body.Response || body;
}

export async function downloadRequest(url: string, dest: string, options?: IDownloadOptions) {
  const { extract, postfix, strip, emptyDir, ...rest } = options || {};

  const spin = spinner(`prepare downloading: ${url}`);
  let len: number;
  if (url.startsWith(RegistryEnum.serverless) || url.startsWith(RegistryEnum.serverlessOld)) {
    try {
      const { headers } = await got(url, { method: 'HEAD' });
      len = parseInt(headers['content-length'], 10);
    } catch (error) {
      // ignore error
    }
  }
  let bar: ProgressService;
  if (len) {
    bar = new ProgressService(ProgressType.Bar, { total: len });
  } else {
    const format = `${green(':loading')} ${green('downloading')} ${cyan(url)} `;
    bar = new ProgressService(ProgressType.Loading, { total: 100 }, format);
  }
  spin.text = `start downloading: ${url}`;
  emptyDir && fs.emptyDirSync(dest);
  try {
    await download(url, dest, { ...rest, rejectUnauthorized: false }).on(
      'downloadProgress',
      (progress) => {
        spin.stop();
        bar.update(progress.transferred);
      },
    );
    bar.terminate();

    if (extract) {
      spin.start(`download success: ${url}`);
      let files = fs.readdirSync(dest);
      let filename = files[0];
      if (postfix && !filename.slice(filename.lastIndexOf('.')).startsWith('.')) {
        fs.rename(path.resolve(dest, filename), `${path.resolve(dest, filename)}.${postfix}`);
        filename += `.${postfix}`;
      }
      spin.text = `${filename} file unzipping...`;
      await decompress(`${dest}/${filename}`, dest, { strip });
      // await fs.unlink(`${dest}/${filename}`);
      spin.succeed(`${filename} file decompression completed`);
    } else {
      spin.start(`download success: ${url}`);
    }
  } catch (error) {
    spin.stop();
    throw error;
  }
}
