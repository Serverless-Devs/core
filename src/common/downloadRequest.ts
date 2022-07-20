import fs from 'fs-extra';
import https from 'https';
import http from 'http';
import spinner, { Ora } from './spinner';
import chalk from 'chalk';
import path from 'path';
import { URL } from 'url';
import decompress, { DecompressOptions } from 'decompress';
import report from '../common/report';
import commandExists from 'command-exists';
import execa from 'execa';
import stripDirs from 'strip-dirs';
import walkSync from 'walk-sync';
import rimraf from 'rimraf';

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
        file.on('open', () => {
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
      let num = 0;
      timer = setInterval(() => {
        const str = '.'.repeat(num);
        num++;
        if (num > 3) {
          num = 0;
        }
        spin.text = filename ? `${filename} file unzipping${str}` : `file unzipping${str}`;
      }, 300);

      let useSystemUnzip = false;
      if (process.env['default_serverless_devs_system_unzip'] === 'true') {
        useSystemUnzip = commandExists.sync('unzip');
      }
      const tmpDir = path.join(path.dirname(dest), `devsapp-package-${Date.now()}`);
      // node-v12.22.1: end of central directory record signature not found
      for (let index = 0; index < 3; index++) {
        try {
          if (useSystemUnzip) {
            if (restOpts?.strip) {
              execa.sync('unzip', ['-d', tmpDir, '-o', filePath]);
              const paths = walkSync(tmpDir);
              for (const p of paths) {
                const fillPath = path.join(tmpDir, p);
                const stat = fs.statSync(fillPath);
                if (stat.isFile()) {
                  const stripPath = stripDirs(p, restOpts.strip);
                  fs.moveSync(fillPath, path.join(dest, stripPath), { overwrite: true });
                }
              }
              rimraf.sync(tmpDir);
            } else {
              execa.sync('unzip', ['-d', dest, '-o', filePath]);
            }
          } else {
            await decompress(filePath, dest, restOpts);
          }
          clearInterval(timer);
          await fs.unlink(filePath);
          const text = 'file decompression completed';
          spin.succeed(filename ? `${filename} ${text}` : text);
          break;
        } catch (error) {
          if (index === 2) {
            clearInterval(timer);
            spin.stop();
            throw error;
          }
        }
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
