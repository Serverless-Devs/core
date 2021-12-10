import got, { Method } from 'got';
import spinner, { Ora } from './spinner';
import { logger } from '../libs/utils';
import report from '../common/report';
import unzip from './unzip';
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

const isResponseOk = (response) => {
  const { statusCode } = response;
  const limitStatusCode = response.request.options.followRedirect ? 299 : 399;

  return (statusCode >= 200 && statusCode <= limitStatusCode) || statusCode === 304;
};

const instance = got.extend({
  https: {
    rejectUnauthorized: false,
  },
  hooks: {
    afterResponse: [
      (response) => {
        if (isResponseOk(response)) {
          response.request.destroy();
        }

        return response;
      },
    ],
  },
});

export async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const errorMessage = (code: string | number, message: string) =>
    `Url:${url}\n,params: ${JSON.stringify(options)}\n,ErrorMessage:${message}\n, Code: ${code}`;
  const {
    method = 'get',
    params,
    body: bodyFromOptions,
    hint = {},
    ignoreError = false,
    json,
    form,
    ...rest
  } = options;
  const { loading, success, error } = hint;
  let spin: Ora;
  let result;
  if (loading) {
    spin = spinner(loading);
  }
  const isGet = method.toUpperCase() === 'GET';

  const configs: any = {
    method,
    ...rest,
  };
  if (isGet) {
    configs.searchParams = params;
  } else if (json) {
    configs.json = bodyFromOptions;
  } else if (form) {
    configs.form = bodyFromOptions;
  } else {
    configs.body = bodyFromOptions;
  }

  try {
    logger.debug(`URL: ${url}`);
    result = await instance(url, configs);
    spin?.stop();
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
  try {
    return JSON.parse(body).Response || body;
  } catch (error) {
    return body;
  }
}

export async function downloadRequest(
  url: string,
  dest: string,
  options: IDownloadOptions = {},
): Promise<void> {
  const { extract, strip, filename } = options;
  const spin = spinner(`start downloading: ${url}`);
  try {
    const res = await instance(url);
    // 是否需要解压
    if (!extract) {
      spin.succeed(`download success: ${url}`);
      return;
    }
    spin.stop();
    await unzip(res.rawBody, dest, { filename, strip });
  } catch (error) {
    spin.stop();
    reportError({
      requestUrl: url,
      statusCode: error.code,
      errorMsg: error.message,
    });
  }
}
