import { zip } from '../../../src/common';

class ZipDemo {
  async testZip() {
    await zip({
      codeUri: './demo',
      include: ['../spinner.ts'],
      exclude: ['a.md'],
      // exclude: ['dir'],
      outputFileName: 'provider',
      // exclude: ['./demo/dir'],
      outputFilePath: './zipdist',
    });
  }

  async testIgnoreZip() {
    await zip({
      codeUri: './demo',
      ignoreFiles: ['.signore'],
      outputFileName: 'provider.zip',
      outputFilePath: './zipdist',
    });
  }
}

const demo = new ZipDemo();

// demo.testZip();
demo.testIgnoreZip();



// 之前抛出的 zip 怎么弄？
/**

参数：
- codeUri: string 必填：代码路径
- outputFilePath: string 输出路径，默认一个地址（当前？）
- outputFileName: string 输出文件名称（不自动加名称后缀，传入什么是什么），默认名称（时间戳.zip？）
- ignoreFiles: string[]  生效的名称，不填写则不尽兴 ignore 操作

*/
