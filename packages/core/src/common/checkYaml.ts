import fs from 'fs-extra';
import yaml from 'js-yaml';
import load from './load';
import { S_ROOT_HOME } from '../libs/common';

function getKeys(obj: object) {
  const key = Object.keys(obj)[0];
  return {
    key,
    value: obj[key],
  };
}

enum BaseType {
  String = 'string',
  Boolean = 'boolean',
  Number = 'number',
  'List<String>' = 'array-string',
  'List<Boolean>' = 'array-boolean',
  'List<Number>' = 'array-number',
}

/*  eslint valid-typeof: "off"  */
async function checkYaml(publish, input, errors, prefix?: string) {
  Object.keys(publish).forEach(async (a) => {
    const errorKey = prefix ? `${prefix}.${a}` : a;
    if (input[a]) {
      const { Type } = publish[a];
      if (Type.length > 1) {
        let errorCount = 0;
        Type.forEach(async (item) => {
          if (typeof item === 'string') {
            if (BaseType[item].includes('array-')) {
              if (Array.isArray(input[a])) {
                input[a].forEach((b) => {
                  if (typeof b !== BaseType[item].split('-')[1]) {
                    errorCount += 1;
                  }
                });
              } else {
                errorCount += 1;
              }
            } else if (typeof input[a] !== BaseType[item]) {
              errorCount += 1;
            }
          } else {
            // object, key为 Enum, Struct, List
            const { key, value } = getKeys(item);
            if (key.includes('Enum')) {
              const filterList = value.filter((obj) => obj === input[a]);
              if (filterList.length === 0) {
                errorCount += 1;
              }
            } else if (key.includes('Struct')) {
              if (typeof input[a] === 'object') {
                await checkYaml(value, input[a], errors, errorKey);
              } else {
                errorCount += 1;
              }
            }
          }
        });
        if (errorCount === Type.length) {
          errors.push({
            [errorKey]: '请检查值的正确性',
          });
        }
      } else {
        const item = Type[0];
        // string, boolean, number, List<string>
        if (typeof item === 'string') {
          if (BaseType[item].includes('array-')) {
            if (Array.isArray(input[a])) {
              input[a].forEach((b) => {
                if (typeof b !== BaseType[item].split('-')[1]) {
                  errors.push({
                    [errorKey]: `请检查值的正确性，需设置为 [${item}]`,
                  });
                }
              });
            } else {
              errors.push({
                [errorKey]: `请检查值的正确性，需设置为 [${item}]`,
              });
            }
          } else if (typeof input[a] !== BaseType[item]) {
            errors.push({
              [errorKey]: `请检查值的正确性，需设置为 [${item}]`,
            });
          }
        } else {
          // object, key为 Enum, Struct List
          const { key, value } = getKeys(item);
          if (key.includes('Enum')) {
            const filterList = value.filter((obj) => obj === input[a]);
            if (filterList.length === 0) {
              errors.push({
                [errorKey]: `请检查值的正确性，需设置为 [${value}]`,
              });
            }
          } else if (key.includes('Struct')) {
            if (typeof input[a] === 'object') {
              await checkYaml(value, input[a], errors, errorKey);
            } else {
              errors.push({
                [errorKey]: '请检查值的正确性，需设置为 [object]',
              });
            }
          } else if (key.includes('List')) {
            if (Array.isArray(input[a])) {
              input[a].forEach(async (b, i) => {
                await checkYaml(value, b, errors, `${errorKey}[${i}]`);
              });
            } else {
              errors.push({
                [errorKey]: '请检查值的正确性，需设置为 [List]',
              });
            }
          }
        }
      }
    } else if (publish[a].Required) {
      errors.push({
        [errorKey]: '必填字段',
      });
    }
  });
}

async function publicCheckYaml(publish, input) {
  const errors = [];
  await checkYaml(publish, input, errors);
  return errors.length > 0 ? errors : null;
}

async function getLocalPublishPath(component: string) {
  const arr = component.split('/');
  const parentDirectory = arr.slice(0, arr.length - 2).join('/');
  if (fs.existsSync(`${parentDirectory}/publish.yaml`)) {
    return `${parentDirectory}/publish.yaml`;
  }
  if (fs.existsSync(`${parentDirectory}/publish.yml`)) {
    return `${parentDirectory}/publish.yml`;
  }
  const sameLevelDirectory = arr.slice(0, arr.length - 1).join('/');
  if (fs.existsSync(`${sameLevelDirectory}/publish.yaml`)) {
    return `${sameLevelDirectory}/publish.yaml`;
  }
  if (fs.existsSync(`${sameLevelDirectory}/publish.yml`)) {
    return `${sameLevelDirectory}/publish.yml`;
  }
  throw new Error(
    `未找到publish.yaml或者publish.yml文件，寻找${component}的同级目录或者上级目录下的publish.yaml或者publish.yaml文件， 同级目录优先级大于上级目录`,
  );
}

async function getPublishPath(Component: string, Provider: string) {
  let publishYamlPath: string;
  if (Component.includes('@')) {
    const [name, version] = Component.split('@');
    publishYamlPath = `${S_ROOT_HOME}/components/${name}-${Provider}@${version}`;
  } else {
    let files = fs.readdirSync(`${S_ROOT_HOME}/components`);
    files = files.filter((item) => item.includes(`${Component}-${Provider}`));
    let maxVersion = files[0];
    files.forEach((item) => {
      if (item > maxVersion) {
        maxVersion = item;
      }
    });
    publishYamlPath = `${S_ROOT_HOME}/components/${maxVersion}`;
  }
  if (fs.existsSync(`${publishYamlPath}/publish.yaml`)) {
    return `${publishYamlPath}/publish.yaml`;
  }
  if (fs.existsSync(`${publishYamlPath}/publish.yml`)) {
    return `${publishYamlPath}/publish.yml`;
  }
  throw new Error('未找到publish.yaml或者publish.yml文件');
}

async function readPublish(input) {
  const { Component, Properties, Provider } = input;
  if (!Component) {
    return [{ Component: '必填字段' }];
  }
  if (!Provider) {
    return [{ Provider: '必填字段' }];
  }
  const exist = fs.existsSync(Component);

  let publishYamlPath: string;
  // 本地调试
  if (exist) {
    publishYamlPath = await getLocalPublishPath(Component);
  } else {
    // 远程获取
    await load(Component, Provider);
    publishYamlPath = await getPublishPath(Component, Provider);
  }
  let content: any;
  try {
    content = yaml.safeLoad(fs.readFileSync(publishYamlPath, 'utf8'));
  } catch (e) {
    throw new Error(e.message);
  }

  if (content.Properties) {
    return publicCheckYaml(content.Properties, Properties);
  } else {
    return null;
  }
}
export default readPublish;
