import fs from 'fs-extra';
import yaml from 'js-yaml';

/**
 *
 * @param filePath 文件的当前路径
 * @description 函数内部会兼容yaml和yml文件，返回文件内容
 */
async function getYamlContent(filePath: string) {
  // yaml 文件
  if (filePath.endsWith('yaml')) {
    if (fs.existsSync(filePath)) {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
    const ymlPath = filePath.replace('.yaml', '.yml');
    if (fs.existsSync(ymlPath)) {
      return yaml.load(fs.readFileSync(ymlPath, 'utf8'));
    }
  }

  // yml 文件
  if (filePath.endsWith('yml')) {
    if (fs.existsSync(filePath)) {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
    const yamlPath = filePath.replace('.yml', '.yaml');
    if (fs.existsSync(yamlPath)) {
      return yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    }
  }
}

export default getYamlContent;
