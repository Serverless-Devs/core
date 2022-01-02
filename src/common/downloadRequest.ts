import fs from 'fs-extra';
import { get, isEmpty } from 'lodash';
const archiveType = require('archive-type');
const decompress = require('decompress');
const getStream = require('get-stream');
const got = require('got');
const pEvent = require('p-event');
import chalk from 'chalk';
import EventEmitter from 'events';
import path from 'path';
import spinner, { Ora } from './spinner';
import report from '../common/report';

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
}

let spin: Ora;

const download = (uri, output, opts, ee) => {
  if (typeof output === 'object') {
    opts = output;
    output = null;
  }

  const TIMEOUT = 300;
  let countFailTimes = 0;
  const transferreds = { last: 0, current: 0 };
  const RETRY_TIMES = 3;
  // TODO: connect 连接异常处理？

  opts = Object.assign(
    {
      encoding: null,
      rejectUnauthorized: process.env.npm_config_strict_ssl !== 'false',
    },
    opts,
  );

  spin = spinner(`Downloading: [${chalk.green(uri)}]`);
  const stream = got.stream(uri, opts);

  stream.on('downloadProgress', ({ transferred }) => {
    transferreds.current = transferred;
    let tips = '';
    if (opts.contentLength > 0) {
      tips = `${transferred}/${opts.contentLength} (${(
        Math.floor(((transferred * 100) / opts.contentLength) * 100) / 100
      ).toFixed(2)}%)`;
    } else {
      tips = `${parseInt(String(transferred / 1024), 10)}KB`;
    }
    spin.text = `Downloading: [${chalk.green(uri)}] ${tips}`;
  });

  stream.on('response', async (res) => {
    const encoding = opts.encoding === null ? 'buffer' : opts.encoding;

    const interval = setInterval(async () => {
      if (transferreds.current === transferreds.last) {
        countFailTimes++;
      } else {
        transferreds.last = transferreds.current;
      }
      // 重试
      if (0 < countFailTimes && countFailTimes <= RETRY_TIMES) {
        clearInterval(interval);
        opts.retries++;
        if (opts.retries >= RETRY_TIMES) {
          spin.fail(`Downloading failed: [${chalk.green(uri)}]`);
          return;
        }
        spin.fail(`Downloading retry: [${chalk.green(uri)}]`);

        res.socket.destroy();
        stream.destroy();
        download(uri, output, opts, ee);
      }
    }, TIMEOUT);

    const result = await Promise.all([getStream(stream, { encoding }), res]);
    interval && clearInterval(interval);
    spin.text = `download success: [${chalk.green(uri)}]`;
    ee.emit('response', result);
  });
};

export default async (uri: string, output: string, options: IDownloadOptions = {}) => {
  let decompressRetry = 0;
  async function downloadRequest(uri: string, output: string, options: IDownloadOptions = {}) {
    try {
      const opts = { rejectUnauthorized: false, ...options };
      const ee = new EventEmitter();
      let contentLength = 0;
      try {
        // serverless的registry,获取content-length
        if (/http[s]+:\/\/registry.devsapp.cn\/simple/.test(uri)) {
          const result = await got(uri, { method: 'HEAD', timeout: 3000 });
          contentLength = get(result, 'headers.content-length', 0);
        }
      } catch (error) {
        // ignore error
      }
      download(uri, output, { ...opts, contentLength, retries: 0 }, ee);
      const result = await pEvent(ee, 'response');
      const [data] = result;
      if (isEmpty(archiveType(data))) {
        const errMsg = `Downloading failed: [${chalk.green(uri)}]`;
        spin.fail(errMsg);
        throw new Error(data.toString ? data.toString() : errMsg);
      }
      const { filename } = opts;

      if (opts.extract && archiveType(data)) {
        spin.text = filename ? `${filename} file unzipping...` : 'file unzipping...';
        try {
          const res = await decompress(data, output, opts);
          const text = 'file decompression completed';
          spin.succeed(filename ? `${filename} ${text}` : text);
          return res;
        } catch (error) {
          if (decompressRetry > 0) return;
          decompressRetry++;
          await downloadRequest(uri, output, options);
        }
      }

      fs.ensureDirSync(output);
      fs.writeFileSync(path.join(output, get(opts, 'filename', 'demo.zip')), data);
      spin.succeed(`download success: [${chalk.green(uri)}]`);
      return data;
    } catch (error) {
      report({
        type: 'networkError',
        content: `${uri}||${error.code}||${error.message}`,
      });
      throw error;
    }
  }
  return await downloadRequest(uri, output, options);
};
