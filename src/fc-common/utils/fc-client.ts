import _ from 'lodash';
import FC from '@alicloud/fc2';
import querystring from 'querystring';
import httpx from 'httpx';
import qs from 'qs';
import FormData from 'form-data';

interface Obj {
  [key: string]: any;
}

// sdk 没有相关接口
/**
 * 获取账号信息，一般获取支持可用区
 */
FC.prototype.getAccountSettings = function (options = {}, headers = {}) {
  return this.get('/account-settings', options, headers);
};

/**
 * 发送请求（基础方法，非调用 HTTP 函数不建议使用）:
 * 1. 请求错误日志会被吞掉
 * 2. 'application/json' 会被强制 json.parse 导致返回，抛出异常无法排查
 * 3. 无法获取返回体的状态码
 * 4. 调用 http 函数 content-type 不生效
 * 5. new Buffer 已经被弃用，使用会抛出异常
 */
FC.prototype.costom_request = async function (
  method: string,
  path: string,
  query: Obj | undefined,
  body: any,
  headers: Obj | undefined = {},
  opts: Obj | undefined = {},
) {
  let url = `${this.endpoint}/${this.version}${path}`;
  if (query && Object.keys(query).length > 0) {
    url = `${url}?${querystring.stringify(query)}`;
  }

  headers = Object.assign(this.buildHeaders(), this.headers, headers);

  let postBody: any;
  if (body) {
    let contentType = headers['content-type'] || headers['Content-Type'];
    if (_.isNil(contentType)) {
      headers['content-type'] = 'text/plain';
      contentType = 'text/plain';
    }
    postBody = handlerBody(contentType, body);
  }

  const queriesToSign = path.startsWith('/proxy/') ? query || {} : null;
  const signature = FC.getSignature(this.accessKeyID, this.accessKeySecret, method, `/${this.version}${path}`, headers, queriesToSign);
  headers.authorization = signature;

  const response = await httpx.request(url, {
    method,
    timeout: this.timeout,
    headers,
    data: postBody,
  });

  let responseBody: any;
  if (!opts.rawBuf || response.headers['x-fc-error-type']) {
    responseBody = await httpx.read(response, 'utf8');
  } else {
    // @ts-ignore: .
    responseBody = await httpx.read(response);
  }

  const contentType = response.headers['content-type'] || '';
  if (contentType.startsWith('application/json')) {
    try {
      responseBody = JSON.parse(responseBody);
    // eslint-disable-next-line no-empty
    } catch (_ex) { }
  }

  let err;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    const code = response.statusCode;
    const requestid = response.headers['x-fc-request-id'];
    let errMsg;
    if (responseBody.ErrorMessage) {
      errMsg = responseBody.ErrorMessage;
    } else {
      errMsg = responseBody.errorMessage;
    }
    err = new Error(`${method} ${path} failed with ${code}. requestid: ${requestid}, message: ${errMsg}.`);
    err.name = `FC${responseBody.ErrorCode}Error`;
    // @ts-ignore: .
    err.code = responseBody.ErrorCode;
  }

  return {
    err,
    code: response.statusCode,
    headers: response.headers,
    data: responseBody,
  };
};

// 方法增强
/**
 * 递归查询列表信息
 * @path 请求的路径
 * @dataKeyword 获取返回结果的关键字
 * @options 请求入参
 * @headers 请求头
 */
FC.prototype.get_all_list_data = async function (
  path,
  dataKeyword,
  options: Obj = {},
  headers?,
) {
  let data = [];
  do {
    const res = await this.get(path, options, headers);

    const keywordData = res.data?.[dataKeyword];
    // eslint-disable-next-line require-atomic-updates
    options.nextToken = res.data?.nextToken;

    if (!_.isEmpty(keywordData)) {
      data = data.concat(keywordData);
    }
  } while (options.nextToken);

  return data;
};

/**
 * 处理请求体
 * @param contentType 请求头 contentType
 * @param body 请求体
 * @returns any
 */
function handlerBody(contentType: string, body: any): any {
  if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/xml')) {
    if (_.isString(body)) return body;
    try {
      return JSON.stringify(body);
    } catch (_ex) {
      return body.toString();
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return qs.stringify(body, { indices: false });
  }

  if (contentType.includes('multipart/form-data')) {
    const form = new FormData();
    try {
      const newBody = _.isObject(body) ? body : JSON.parse(body);
      for (const [key, value] of Object.entries(newBody)) {
        form.append(key, value);
      }
      return form;
    } catch (_ex) {
      throw new Error(`Handler body error: The request header is ${contentType}, but the request body is not an object`);
    }
  }

  return body;
}
