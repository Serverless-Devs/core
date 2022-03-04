import path from 'path';
import fs from 'fs-extra';
import { getYamlContent } from '../../libs';
import { isEmpty, get, includes, isPlainObject, find, merge, isArray, isString } from 'lodash';
import yaml from 'js-yaml';
import chalk from 'chalk';
import extend2 from 'extend2';
import { humanWarning } from './utils';
import parseYaml from '../parseYaml';

async function checkEdition(spath: string) {
  const filename = path.basename(spath);
  const data = await getYamlContent(spath);
  if (['1.0.0', '2.0.0'].includes(get(data, 'edition'))) {
    return spath;
  }
  throw new Error(
    JSON.stringify({
      message: `The edtion field in the ${filename} file is incorrect.`,
      tips: `Please check the edtion field of ${filename}, you can specify it as 1.0.0 or 2.0.0.`,
    }),
  );
}

async function setupEnv(templateFile: string) {
  const spath = path.dirname(templateFile);
  require('dotenv').config({ path: path.join(spath, '.env') });
  const data = await getYamlContent(templateFile);
  const { services } = data;
  for (const key in services) {
    const element = services[key];
    let codeUri = get(element, 'props.function.codeUri');
    if (codeUri) {
      codeUri = path.isAbsolute(codeUri) ? codeUri : path.join(spath, codeUri);
      require('dotenv').config({ path: path.join(codeUri, '.env') });
    }
  }
}

async function transforData(a, b) {
  const newObj = {};
  const tmpArr = [];
  for (const key in b) {
    if (includes(key, '.')) {
      tmpArr.push({
        key,
        value: b[key],
      });
    } else if (key !== 'extends') {
      newObj[key] = b[key];
    }
  }
  function deepCopy(oldVal: any, parentStr = '') {
    const findObj = find(tmpArr, (o) => o.key === parentStr);
    let obj = oldVal;
    if (findObj) {
      obj = obj.constructor === Array ? findObj.value : merge(oldVal, findObj.value);
    }
    let result: any = obj.constructor === Array ? [] : {};
    if (typeof obj === 'object') {
      if (isPlainObject(obj)) {
        if (parentStr !== '') {
          parentStr = `${parentStr}.`;
        }
      }
      for (const i in obj) {
        let val = obj[i];
        const tmpStr = isPlainObject(obj) ? `${parentStr}${i}` : `${parentStr}[${i}]`;
        result[i] = typeof val === 'object' ? deepCopy(val, tmpStr) : val;
      }
    } else {
      result = obj;
    }
    return result;
  }
  const result = extend2(true, a, newObj);
  return deepCopy(result);
}

async function isYamlFile(filePath: string, options: { warn?: boolean } = {}) {
  const { warn = true } = options;
  if (typeof filePath !== 'string') {
    return false;
  }
  if (fs.existsSync(filePath)) {
    const arr = ['.yaml', '.yaml'];
    if (arr.includes(path.extname(filePath))) {
      try {
        await yaml.load(fs.readFileSync(filePath, 'utf8'));
        return true;
      } catch (error) {
        const filename = path.basename(filePath);
        throw new Error(
          JSON.stringify({
            message: `${filename} format is incorrect`,
            tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：${chalk.underline(
              'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md',
            )}`,
          }),
        );
      }
    }
    return false;
  }
  warn && humanWarning(`${filePath} file was not found.`);
  return false;
}

async function extendsYaml(data: string | string[], options) {
  if (isEmpty(data)) return;
  let tmp = {};
  if (isArray(data)) {
    for (const item of data) {
      const bol = await isYamlFile(item, options);
      if (bol) {
        const doc = await parseYaml(fs.readFileSync(item, 'utf8'));
        tmp = extend2(true, tmp, doc);
      }
    }
  }

  if (isString(data)) {
    const bol = await isYamlFile(data, options);
    if (bol) {
      tmp = await parseYaml(fs.readFileSync(data, 'utf8'));
    }
  }
  return tmp;
}

export async function transforYamlPath(spath: string = '', options?: { warn?: boolean }) {
  await isYamlFile(spath, options);
  await setupEnv(spath);
  const data = await getYamlContent(spath);
  if (isEmpty(data?.extends)) {
    return checkEdition(spath);
  }
  const tmp = await extendsYaml(data.extends, options);
  const extend2Data = await transforData(tmp, data);
  const tempPath = path.join(path.dirname(spath), '.s', path.basename(spath));
  fs.ensureFileSync(tempPath);
  fs.writeFileSync(tempPath, yaml.dump(extend2Data));
  return checkEdition(tempPath);
}

export async function getTemplatePath(spath: string = '') {
  const filePath = path.isAbsolute(spath) ? spath : path.resolve(spath);
  if (fs.existsSync(filePath)) return filePath;
  const cwd = process.cwd();
  const sYamlPath = path.join(cwd, 's.yaml');
  if (fs.existsSync(sYamlPath)) return sYamlPath;
  const sYmlPath = path.join(cwd, 's.yml');
  if (fs.existsSync(sYmlPath)) return sYmlPath;
  throw new Error(
    JSON.stringify({
      message: 'the s.yaml/s.yml file was not found.',
      tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
    }),
  );
}
