import fs from 'fs-extra';
import https from 'https';
import http from 'http';
import spinner, { Ora } from './spinner';
import chalk from 'chalk';
import path from 'path';
import { URL } from 'url';
import decompress, { DecompressOptions } from 'decompress';
import report from '../common/report';
export interface IOptions extends DecompressOptions {
  /**
   * If set to true, try extracting the file using decompress.
   */
  extract?: boolean;
  /**
   * Name of the saved file, default value is demo.zip
   */
  filename?: string;
}

async function download(url: string, dest: string, options: IOptions = {}) {
  const { filename = 'demo.zip' } = options;
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return await new Promise<{ filePath: string; spin: Ora }>((resolve, reject) => {
    pkg.get(uri.href).on('response', (res) => {
      const len = parseInt(res.headers['content-length'], 10);
      fs.ensureDirSync(dest);
      const filePath = path.join(dest, filename);
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        const spin = spinner(`Downloading: [${chalk.green(decodeURIComponent(uri.pathname))}]`);
        let downloaded = 0;
        res
          .on('data', (chunk) => {
            file.write(chunk);
            downloaded += chunk.length;
            const tips = len
              ? `${downloaded}/${len} ${((100.0 * downloaded) / len).toFixed(2)}%`
              : `${parseInt(String(downloaded / 1024), 10)}KB`;
            spin.text = `Downloading: [${chalk.green(decodeURIComponent(uri.pathname))}] ${tips}`;
          })
          .on('end', () => {
            file.end();
            resolve({ filePath, spin });
          })
          .on('error', (err) => {
            file.destroy();
            spin.fail();
            fs.unlink(dest, () => reject(err));
          });
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        // Recursively follow redirects, only a 200 will resolve.
        download(res.headers.location, dest, options).then((val) => resolve(val));
      } else {
        reject({
          code: res.statusCode,
          message: res.statusMessage,
        });
      }
    });
  });
}

export default async (url: string, dest: string, options: IOptions = {}) => {
  const { extract, filename, ...restOpts } = options;
  try {
    const { filePath, spin } = await download(url, dest, options);
    if (extract) {
      let timer;
      try {
        let num = 0;
        timer = setInterval(() => {
          const str = '.'.repeat(num);
          num++;
          if (num > 3) {
            num = 0;
          }
          spin.text = filename ? `${filename} file unzipping${str}` : `file unzipping${str}`;
        }, 300);
        await decompress(filePath, dest, restOpts);
        clearInterval(timer);
        await fs.unlink(filePath);
        const text = 'file decompression completed';
        spin.succeed(filename ? `${filename} ${text}` : text);
      } catch (error) {
        clearInterval(timer);
        spin.stop();
        throw error;
      }
    } else {
      spin.succeed();
    }
  } catch (error) {
    report({
      type: 'networkError',
      content: `${url}||${error.code}||${error.message}`,
    });
    throw error;
  }
};
