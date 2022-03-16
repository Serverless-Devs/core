import fs from 'fs';
import https from 'https';
import http from 'http';
import spinner from './spinner';
import chalk from 'chalk';
import { URL } from 'url';

function download(url: string, dest: string) {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return new Promise<void>((resolve, reject) => {
    pkg.get(uri.href).on('response', (res) => {
      const len = parseInt(res.headers['content-length'], 10);
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        const spin = spinner(`Downloading: [${chalk.green(url)}]`);
        let downloaded = 0;
        res
          .on('data', (chunk) => {
            file.write(chunk);
            downloaded += chunk.length;
            const tips = len
              ? `${downloaded}/${len} ${((100.0 * downloaded) / len).toFixed(2)}%`
              : `${parseInt(String(downloaded / 1024), 10)}`;
            spin.text = `Downloading: [${chalk.green(decodeURIComponent(uri.pathname))}] ${tips}`;
          })
          .on('end', () => {
            file.end();
            spin.succeed();
            resolve();
          })
          .on('error', (err) => {
            file.destroy();
            fs.unlink(dest, () => reject(err));
          });
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        // Recursively follow redirects, only a 200 will resolve.
        download(res.headers.location, dest).then(() => resolve());
      } else {
        reject(
          new Error(
            `Download request failed, response status: ${res.statusCode} ${res.statusMessage}`,
          ),
        );
      }
    });
  });
}

export default download;
