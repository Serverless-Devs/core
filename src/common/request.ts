import got from '@xsahxl/got';
import _ from 'lodash';
import spinner from './spinner';
import { logger } from '../logger';
import report from '../common/report';
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

async function request(url: string, options?: RequestOptions): Promise<any> {
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
        statusCode: e.code,
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

export default request;
