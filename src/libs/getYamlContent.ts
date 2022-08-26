import fs from 'fs-extra';
import yaml from 'js-yaml';

/**
 *
 * @param filePath 文件的当前路径
 * @description 函数内部会兼容yaml和yml文件，返回文件内容
 */
async function getYamlContent(filePath: string) {
  if (filePath.endsWith('yml') || filePath.endsWith('yaml')) {
    if (fs.existsSync(filePath)) {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
    const yamlPath = filePath.endsWith('yml')
      ? filePath.replace('yml', 'yaml')
      : filePath.replace('yaml', 'yml');
    if (fs.existsSync(yamlPath)) {
      return yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    }
  }
}

export default getYamlContent;
