import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

async function isYamlFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} file was not found.`);
  }
  const arr = ['.yaml', '.yml'];
  if (!arr.includes(path.extname(filePath))) {
    throw new Error(`${filePath} file should be yaml or yml file.`);
  }
  try {
    await yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (error /* YAMLException */) {
    const filename = path.basename(filePath);
    let message = `${filename} format is incorrect`;
    if (error.message) message += `: ${error.message}`;
    throw new Error(
      JSON.stringify({
        message,
        tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
          'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
        )}`,
      }),
    );
  }
}

export default isYamlFile;
