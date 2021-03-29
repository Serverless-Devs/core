import fs from 'fs-extra';
import archiver from 'archiver';
import get from 'lodash.get';
import { green } from 'colors';
import { ProgressService, ProgressType } from '@serverless-devs/s-progress-bar';
import path from 'path';
import ignore from 'ignore';
import readline from 'readline';
const processCwd = process.cwd();

const isWindows = process.platform === 'win32';

interface Options {
  codeUri: string;
  exclude?: Array<string>;
  include?: Array<string>;
  outputFileName?: string;
  outputFilePath?: string;
}

async function zip(options: Options) {
  const { codeUri, exclude, include, outputFileName, outputFilePath = './' } = options;

  let fileName: string;
  if (outputFileName) {
    fileName = outputFileName.includes('.') ? outputFileName : `${outputFileName}.zip`;
  } else {
    fileName = 'demo.zip';
  }

  await fs.ensureDir(outputFilePath);

  if (!(await fs.pathExists(codeUri))) {
    throw new Error(`CodeUri: ${codeUri} is not exist`);
  }

  const fsStat = await fs.stat(codeUri);
  if (fsStat.isFile() && exclude && include) {
    throw new Error(`${codeUri} is file, and Include/Exclude was not provided`);
  }

  const output = fs.createWriteStream(`${outputFilePath}/${fileName}`);
  console.log('Packing ...');

  const zipArchiver = archiver('zip', {
    zlib: { level: 9 },
  })
    .on('warning', (err) => {
      console.warn(err);
    })
    .on('error', (err) => {
      throw err;
    });
  zipArchiver.pipe(output);
  let count = await zipTo(codeUri, zipArchiver, exclude);
  if (include) {
    for (const item of include) {
      const c = await zipTo(item, zipArchiver);
      count += c;
    }
  }

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
      console.log('Package complete.');
      resolve({ count, compressedSize });
    });

    try {
      zipArchiver.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

async function zipTo(codeUri, zipArchiver, exclude?) {
  const asbFilePath = path.resolve(codeUri);
  const fsStat = await fs.stat(codeUri);
  if (fsStat.isFile()) {
    const isBootstrap = isBootstrapPath(asbFilePath, asbFilePath, true);
    zipArchiver.file(asbFilePath, {
      name: path.basename(codeUri),
      mode: isBootstrap ? fsStat.mode | 73 : fsStat.mode,
    });
    return 1;
  }
  let funignore = null;
  if (exclude) {
    funignore = await generateFunIngore(processCwd, codeUri, exclude);
  }
  const count = await zipFolder(zipArchiver, codeUri, [], funignore, codeUri, '');
  return count;
}

async function zipFolder(zipArchiver, folder, folders, funignore, codeUri, prefix = '') {
  folders.push(folder);
  const absCodeUri = path.resolve(codeUri);
  const dir = path.join(...folders);
  const dirItems = await fs.readdir(dir);

  const pmaps: Array<number> = await Promise.all(
    dirItems.map(async (f) => {
      const fPath = path.join(dir, f);

      let s;

      try {
        s = await fs.lstat(fPath);
      } catch (error) {
        console.log(
          `Before zip: could not found fPath ${fPath}, absolute fPath is ${path.resolve(
            fPath,
          )}, exception is ${error}, skiping`,
        );
        return 0;
      }

      // TODO we need to ignore .s directory, but dont want to show redundant log.
      // find a better way to handle this log problem
      if (funignore && funignore(fPath)) {
        console.log('file %s is ignored.', fPath);
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

      if (s.isFile() || s.isSymbolicLink()) {
        zipArchiver.file(fPath, {
          name: relative,
          prefix,
          mode: isBootstrap || isWindows ? s.mode | 73 : s.mode,
          stats: s, // The archiver uses fs.stat by default, and pasing the result of lstat to ensure that the symbolic link is properly packaged
        });

        return 1;
      } else if (s.isDirectory()) {
        return await zipFolder(zipArchiver, f, folders.slice(), funignore, codeUri, prefix);
      }
      console.error(
        `Ignore file ${absFilePath}, because it isn't a file, symbolic link or directory`,
      );
      return 0;
    }),
  );

  return pmaps.reduce((sum: number, curr: number) => sum + curr, 0);
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

function isBootstrapPath(absFilePath, absCodeUri, isFile = true) {
  let absBootstrapDir;
  if (isFile) {
    absBootstrapDir = path.dirname(absCodeUri);
  } else {
    absBootstrapDir = absCodeUri;
  }
  return path.join(absBootstrapDir, 'bootstrap') === absFilePath;
}

async function generateFunIngore(baseDir, codeUri, exclude) {
  const absCodeUri = path.resolve(baseDir, codeUri);
  const absBaseDir = path.resolve(baseDir);

  const relative = path.relative(absBaseDir, absCodeUri);

  if (codeUri.startsWith('..') || relative.startsWith('..')) {
    console.warn(`\t\tFunignore is not supported for your CodeUri: ${codeUri}`);
    return null;
  }

  const ig = ignore().add(exclude.map((o) => path.join(o)));
  return function (f) {
    const relativePath = path.relative(baseDir, f);
    if (relativePath === '') {
      return false;
    }
    return ig.ignores(relativePath);
  };
}

export default zip;
