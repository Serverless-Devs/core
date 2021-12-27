'use strict';
const fs = require('fs');
import _ from 'lodash';
const path = require('path');
const { URL } = require('url');
const contentDisposition = require('content-disposition');
const archiveType = require('archive-type');
const decompress = require('decompress');
const filenamify = require('filenamify');
const getStream = require('get-stream');
const got = require('got');
const makeDir = require('make-dir');
const pify = require('pify');
const pEvent = require('p-event');
const fileType = require('file-type');
const extName = require('ext-name');
import chalk from 'chalk';
import EventEmitter from 'events';
import spinner from './spinner';

const fsP = pify(fs);
const filenameFromPath = res => path.basename(new URL(res.requestUrl).pathname);

const getExtFromMime = res => {
	const header = res.headers['content-type'];

	if (!header) {
		return null;
	}

	const exts = extName.mime(header);

	if (exts.length !== 1) {
		return null;
	}

	return exts[0].ext;
};

const getFilename = (res, data) => {
	const header = res.headers['content-disposition'];

	if (header) {
		const parsed = contentDisposition.parse(header);

		if (parsed.parameters && parsed.parameters.filename) {
			return parsed.parameters.filename;
		}
	}

	let filename = filenameFromPath(res);

	if (!path.extname(filename)) {
		const ext = (fileType(data) || {}).ext || getExtFromMime(res);

		if (ext) {
			filename = `${filename}.${ext}`;
		}
	}

	return filename;
};

const download = (uri, output, opts, ee) => {
	if (typeof output === 'object') {
		opts = output;
		output = null;
	}
	
	const TIMEOUT = 2500;
	let countFailTimes = 0;
	const transferreds = { last: 0,current: 0 };
	const RETRY_TIMES = 3;
	// TODO: connect 连接异常处理？

	opts = Object.assign({
		encoding: null,
		rejectUnauthorized: process.env.npm_config_strict_ssl !== 'false'
	}, opts);

	const spin = spinner(`Downloading: [${chalk.green(uri)}]`);
	const stream = got.stream(uri, opts);
	let interval;

	stream.on('downloadProgress', ({transferred}) => {
		transferreds.current = transferred;
		let tips = '';
		if(opts.contentLength > 0 ) {
			tips = `${transferred}/${opts.contentLength} (${(Math.floor(transferred*100/opts.contentLength * 100) / 100).toFixed(2)}%)`
		} else {
			// @ts-ignore
			tips = `${parseInt(transferred/1024, 10)}KB`
		}
		spin.text = `Downloading: [${chalk.green(uri)}] ${tips}`;
	});


	stream.on('response', async res => {
		const encoding = opts.encoding === null ? 'buffer' : opts.encoding;

		interval = setInterval(async () => {
			if(transferreds.current === transferreds.last) {
				countFailTimes++;
			} else {
				transferreds.last = transferreds.current;
			}
			// 重试
			if(0 < countFailTimes && countFailTimes <= RETRY_TIMES) {
				clearInterval(interval);
				opts.retries++;
				res.socket.destroy();
				stream && stream.destroy();
				if(opts.retries >= RETRY_TIMES) {
					spin.fail(`Downloading failed: [${chalk.green(uri)}]`);
					return;
				}
				
				spin.fail(`Downloading retry: [${chalk.green(uri)}]`);
				download(uri, output, opts, ee);
			}
		}, TIMEOUT);

		const result = await Promise.all([getStream(stream, {encoding}), res]);
		clearInterval(interval);
		spin.succeed(`download success: ${uri}`);
		ee.emit('response', result)
	});
};

export default async (uri, output, opts) => {
	const ee = new EventEmitter();
	let contentLength = 0;
	try {
		// serverless的registry,获取content-length
		if(/http[s]+:\/\/registry.devsapp.cn\/simple/.test(uri)) {
		  const result = await got(uri, { method: 'HEAD',timeout: 3000 });
		  contentLength = _.get(result, 'headers.content-length', 0);
		}
	} catch (error) {
		// ignore error
	}
	download(uri, output, {...opts, contentLength, retries: 0}, ee);
	
	const result = await pEvent(ee, 'response')
	const [data, res] = result;
	if (!output) {
		return opts.extract && archiveType(data) ? decompress(data, opts) : data;
	}

	const filename = opts.filename || filenamify(getFilename(res, data));
	const outputFilepath = path.join(output, filename);

	if (opts.extract && archiveType(data)) {
		return decompress(data, path.dirname(outputFilepath), opts);
	}
	
	return makeDir(path.dirname(outputFilepath))
		.then(() => fsP.writeFile(outputFilepath, data))
		.then(() => data);
}