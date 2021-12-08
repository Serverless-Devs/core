import stripDirs from 'strip-dirs';
import AdmZip from 'adm-zip';
import path from 'path';
import spinner from './spinner';

interface IOptions {
  filename?: string;
  strip?: number;
}

function spinSucceed(spin, filename) {
  spin.succeed(
    filename ? `${filename} file decompression completed` : 'file decompression completed',
  );
}
async function unzip(
  input: string | Buffer,
  output: string = process.cwd(),
  options: IOptions = {},
) {
  const zip = new AdmZip(input);
  const { filename, strip } = options;

  const spin = spinner(filename ? `${filename} file unzipping...` : 'file unzipping...');

  // 是否提取目录层级
  if (!strip) {
    zip.extractAllTo(output, true);
    spinSucceed(spin, filename);
    return;
  }
  const zipEntries = zip.getEntries();
  for (const iterator of zipEntries) {
    const filepath = path.join(output, stripDirs(iterator.entryName, strip));
    zip.extractEntryTo(iterator.entryName, path.dirname(filepath), false, true);
  }
  spinSucceed(spin, filename);
}

export default unzip;
