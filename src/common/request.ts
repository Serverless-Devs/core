import got from 'got';
import spinner, { Ora } from './spinner';
import { logger } from '../libs/utils';
import report from '../common/report';
import unzip from './unzip';
import getStream from 'get-stream';
import fs from 'fs-extra';

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
  extract?: boolean;
  filename?: string;
  strip?: number;
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
  let vm: Ora;
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

export async function downloadRequest(
  url: string,
  dest: string,
  options: IDownloadOptions = {},
): Promise<void> {
  const { extract, strip, filename } = options;
  const spin = spinner(`start downloading: ${url}`);
  try {
    const stream = got.stream(url);
    const res = await getStream(stream, { encoding: 'buffer' });
    // 是否需要解压
    if (!extract) {
      fs.writeFileSync(filename || 'demo.zip', res);
      spin.succeed(`download success: ${url}`);
      return;
    }
    spin.stop();
    await unzip(res, dest, { filename, strip });
  } catch (error) {
    spin.stop();
    reportError({
      requestUrl: url,
      statusCode: error.code,
      errorMsg: error.message,
    });
  }
}
