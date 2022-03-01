import fs from 'fs-extra';
import _ from 'lodash';
import archiver from 'archiver';
import { get } from 'lodash';
import { green } from 'chalk';
import path from 'path';
import readline from 'readline';
import { ProgressService, ProgressType } from '@serverless-devs/s-progress-bar';
import { CatchableError } from '../error';
import { logger } from '../../logger';
import ignoreWalk from '../ignoreWalk';

const isWindows = process.platform === 'win32';

export interface IgnoreOptions {
  codeUri: string;
  ignoreFiles?: string[];
  include?: string[];
  outputFilePath?: string;
  outputFileName?: string;
}

export async function ignoreZip (options: IgnoreOptions) {
  const { codeUri, ignoreFiles, include, outputFileName, outputFilePath = './' } = options;
  
  // 处理文件前的校验
  if (!(await fs.pathExists(codeUri))) {
    throw new CatchableError(`CodeUri: ${codeUri} is not exist`);
  }
  if (!_.isEmpty(include)) {
    for (const file of include) {
      // 处理文件前的校验
      if (!(await fs.pathExists(file))) {
        throw new CatchableError(`CodeUri: ${file} is not exist`);
      }
    }
  }
  const fsStat = await fs.stat(codeUri);
  if (fsStat.isFile() && !_.isEmpty(ignoreFiles) && !_.isEmpty(include)) {
    logger.warn(`${codeUri} is file, and Include/ignore was not provided`);
  }
  // 准备输出
  const fileName = outputFileName ? outputFileName : 'demo.zip';
  await fs.ensureDir(outputFilePath);
  const output = fs.createWriteStream(path.join(outputFilePath, fileName));
  logger.debug('Packing ...');
  const zipArchiver = archiver('zip', { zlib: { level: 9 }})
    .on('warning', (err) => logger.warn(err))
    .on('error', (err) => { throw err });
  zipArchiver.pipe(output);
  
  let count = await zipTo(codeUri, zipArchiver, ignoreFiles);
  
  return await new Promise((resolve, reject) => {
    let bar: ProgressService;
    zipArchiver.on('progress', (processOptions) => {
      if (!bar) {
        bar = new ProgressService(
          ProgressType.Bar,
          { total: get(processOptions, 'fs.totalBytes') },
          `${green('ziping')} ((:bar)) :current/:total(Bytes) :percent :etas`,
        );
      }
      bar.update(get(processOptions, 'fs.processedBytes'));
    });
    output.on('close', () => {
      const compressedSize = zipArchiver.pointer();
      logger.debug('Package complete.');
      resolve({ count, compressedSize });
    });

    try {
      zipArchiver.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

async function zipTo(codeUri, zipArchiver, ignoreFiles = []) {
  const absCodeUri = path.resolve(codeUri);
  const fsStat = await fs.stat(codeUri);

  // 处理单个文件
  if (fsStat.isFile()) {
    const isBootstrap = isBootstrapPath(absCodeUri, absCodeUri, true);
    zipArchiver.file(absCodeUri, {
      name: path.basename(codeUri),
      mode: isBootstrap ? fsStat.mode | 73 : fsStat.mode,
    });
    return 1;
  }

  const zipFiles = ignoreWalk.sync({
    ignoreFiles,
    path: codeUri,
    includeEmpty: true,
  });
  logger.debug(`zip files list:: ${zipFiles}`);

  await Promise.all(
    zipFiles.map(async (f) => {
      const fPath = path.join(codeUri, f);
      let s;
      try {
        s = await fs.lstat(fPath);
      } catch (error) {
        logger.log(
          `Before zip: could not found fPath ${fPath}, absolute fPath is ${path.resolve(
            fPath,
          )}, exception is ${error}, skiping`,
        );
        return 0;
      }

      const absFilePath = path.resolve(fPath);
      const relative = path.relative(absCodeUri, absFilePath);

      const isBootstrap = isBootstrapPath(absFilePath, absCodeUri, false);

      if (s.size === 1067) {
        const content: any = await readLines(fPath);
        if (content[0] === 'XSym' && content.length === 5) {
          const target = content[3];
          zipArchiver.symlink(relative, target, {
            mode: isBootstrap || isWindows ? s.mode | 73 : s.mode,
          });
          return 1;
        }
      }

      zipArchiver.file(fPath, {
        name: relative,
        mode: isBootstrap || isWindows ? s.mode | 73 : s.mode,
        stats: s, // The archiver uses fs.stat by default, and pasing the result of lstat to ensure that the symbolic link is properly packaged
      });

      return 1;
    })
  );

  return zipFiles.length;
}

function isBootstrapPath(absFilePath, absCodeUri, isFile = true) {
  let absBootstrapDir;
  if (isFile) {
    absBootstrapDir = path.dirname(absCodeUri);
  } else {
    absBootstrapDir = absCodeUri;
  }
  return path.join(absBootstrapDir, 'bootstrap') === absFilePath;
}

function readLines(fileName) {
  return new Promise((resolve, reject) => {
    const lines = [];

    readline
      .createInterface({ input: fs.createReadStream(fileName) })
      .on('line', (line) => lines.push(line))
      .on('close', () => resolve(lines))
      .on('error', reject);
  });
}
