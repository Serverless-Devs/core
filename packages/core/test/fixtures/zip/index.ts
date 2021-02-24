import { zip, unzip } from '../../../src/common';

class ZipDemo {
  testZip() {
    zip({
      codeUri: './demo',
      include: ['../spinner.ts'],
      exclude: ['a.md'],
      // exclude: ['dir'],
      outputFileName: 'provider',
      // exclude: ['./demo/dir'],
      outputFilePath: './zipdist',
    });
  }
  async testUnzip() {
    await unzip('./zipdist/provider.jar', 'unzip-dist');
    console.log('done!');
  }
}

const demo = new ZipDemo();

demo.testZip();

// demo.testUnzip();
