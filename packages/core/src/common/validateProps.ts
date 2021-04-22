import fs from 'fs-extra';
import { loadComponent } from './load';
import { S_ROOT_HOME } from '../libs/common';
import getYamlContent from './getYamlContent';

function getKeys(obj: object) {
  const key = Object.keys(obj)[0];
  return {
    key,
    value: obj[key],
  };
}

function isArray(value: any): boolean {
  return Array.isArray(value);
}

function getValueType(value: any) {
  return typeof value;
}

/*  eslint valid-typeof: "off"  */
async function checkYaml(publish, input, errors, prefix?: string) {
  Object.keys(publish).forEach(async (a) => {
    const errorKey = prefix ? `${prefix}.${a}` : a;
    // if value exist
    if (input[a]) {
      const { Type } = publish[a];
      // type为数组且长度大于1的case，满足条件其一即可
      if (isArray(Type) && Type.length > 1) {
        let errorCount = 0;
        Type.forEach(async (item) => {
          if (item === 'String') {
            getValueType(input[a]) !== 'string' && (errorCount += 1);
          }

          if (item === 'Number') {
            getValueType(input[a]) !== 'number' && (errorCount += 1);
          }

          if (item === 'Boolean') {
            getValueType(input[a]) !== 'boolean' && (errorCount += 1);
          }

          if (item === 'Null') {
            input[a] !== null && (errorCount += 1);
          }

          if (item === 'List<String>') {
            if (isArray(input[a])) {
              input[a].some((obj) => getValueType(obj) !== 'string') && (errorCount += 1);
            } else {
              errorCount += 1;
            }
          }

          if (item === 'List<Number>') {
            if (isArray(input[a])) {
              input[a].some((obj) => getValueType(obj) !== 'number') && (errorCount += 1);
            } else {
              errorCount += 1;
            }
          }

          if (item === 'List<Boolean>') {
            if (isArray(input[a])) {
              input[a].some((obj) => getValueType(obj) !== 'boolean') && (errorCount += 1);
            } else {
              errorCount += 1;
            }
          }

          if (item === 'List<Null>') {
            if (isArray(input[a])) {
              input[a].some((obj) => obj !== null) && (errorCount += 1);
            } else {
              errorCount += 1;
            }
          }

          // typeof item 为 object 的 case
          if (getValueType(item) === 'object') {
            const { key, value } = getKeys(item);
            // key为 Enum, Struct List
            if (key.includes('Enum')) {
              const filterList = value.filter((obj) => obj === input[a]);
              if (filterList.length === 0) {
                errorCount += 1;
              }
            }

            if (key.includes('Struct')) {
              if (getValueType(input[a]) === 'object') {
                await checkYaml(value, input[a], errors, errorKey);
              } else {
                errorCount += 1;
              }
            }

            if (key.includes('List')) {
              if (isArray(input[a])) {
                input[a].forEach(async (b, i) => {
                  await checkYaml(value, b, errors, `${errorKey}[${i}]`);
                });
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
        const item = isArray(Type) ? Type[0] : Type;
        // typeof item 为 string 的 case
        // String, Number, Boolean, Null, List<T>
        if (item === 'String') {
          getValueType(input[a]) !== 'string' &&
            errors.push({
              [errorKey]: '请检查值的类型，需设置为 [String] 类型',
            });
        }

        if (item === 'Number') {
          getValueType(input[a]) !== 'number' &&
            errors.push({
              [errorKey]: '请检查值的类型，需设置为 [Number] 类型',
            });
        }

        if (item === 'Boolean') {
          getValueType(input[a]) !== 'boolean' &&
            errors.push({
              [errorKey]: '请检查值的类型，需设置为 [Boolean] 类型',
            });
        }

        if (item === 'Null') {
          input[a] !== null &&
            errors.push({
              [errorKey]: '请检查值的正确性，需设置为 null',
            });
        }

        if (item === 'List<String>') {
          if (isArray(input[a])) {
            input[a].forEach((obj, index) => {
              getValueType(obj) !== 'string' &&
                errors.push({
                  [`${errorKey}[${index}]`]: '请检查值的类型，需设置为 [String] 类型',
                });
            });
          } else {
            errors.push({
              [errorKey]: '请检查值的正确性，需设置为 [List]',
            });
          }
        }

        if (item === 'List<Number>') {
          if (isArray(input[a])) {
            input[a].forEach((obj, index) => {
              getValueType(obj) !== 'number' &&
                errors.push({
                  [`${errorKey}[${index}]`]: '请检查值的类型，需设置为 [Number] 类型',
                });
            });
          } else {
            errors.push({
              [errorKey]: '请检查值的正确性，需设置为 [List]',
            });
          }
        }

        if (item === 'List<Boolean>') {
          if (isArray(input[a])) {
            input[a].forEach((obj, index) => {
              getValueType(obj) !== 'boolean' &&
                errors.push({
                  [`${errorKey}[${index}]`]: '请检查值的类型，需设置为 [Boolean] 类型',
                });
            });
          } else {
            errors.push({
              [errorKey]: '请检查值的正确性，需设置为 [List]',
            });
          }
        }

        if (item === 'List<Null>') {
          if (isArray(input[a])) {
            input[a].forEach((obj, index) => {
              obj !== null &&
                errors.push({
                  [`${errorKey}[${index}]`]: '请检查值的正确性，需设置为 [null]',
                });
            });
          } else {
            errors.push({
              [errorKey]: '请检查值的正确性，需设置为 [List]',
            });
          }
        }

        // typeof item 为 object 的 case
        if (getValueType(item) === 'object') {
          const { key, value } = getKeys(item);
          // key为 Enum, Struct List
          if (key.includes('Enum')) {
            const filterList = value.filter((obj) => obj === input[a]);
            if (filterList.length === 0) {
              errors.push({
                [errorKey]: `请检查值的正确性，需设置为 [${value}]`,
              });
            }
          }

          if (key.includes('Struct')) {
            if (getValueType(input[a]) === 'object') {
              await checkYaml(value, input[a], errors, errorKey);
            } else {
              errors.push({
                [errorKey]: '请检查值的正确性，需设置为 [Object]',
              });
            }
          }

          if (key.includes('List')) {
            if (isArray(input[a])) {
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
      // value is required or not
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

async function getLocalPublish(component: string) {
  const arr = component.split('/');
  const parentDirectory = arr.slice(0, arr.length - 2).join('/');
  let result: any;
  result = await getYamlContent(`${parentDirectory}/publish.yaml`);
  if (result) return result;

  const sameLevelDirectory = arr.slice(0, arr.length - 1).join('/');
  result = await getYamlContent(`${sameLevelDirectory}/publish.yaml`);
  if (result) return result;
  throw new Error(
    `未找到publish.yaml或者publish.yml文件，寻找${component}的同级目录或者上级目录下的publish.yaml或者publish.yaml文件， 同级目录优先级大于上级目录`,
  );
}

async function getPublish(Component: string, Provider: string) {
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
  const result = getYamlContent(`${publishYamlPath}/publish.yaml`);
  if (result) return;
  throw new Error('未找到publish.yaml或者publish.yml文件');
}

async function validateProps(input) {
  const { Component, Properties, Provider } = input;
  if (!Component) {
    return [{ Component: '必填字段' }];
  }
  if (!Provider) {
    return [{ Provider: '必填字段' }];
  }
  const exist = fs.existsSync(Component);

  let content: any;
  // 本地调试
  if (exist) {
    content = await getLocalPublish(Component);
  } else {
    // 远程获取
    await loadComponent(`${Provider}/${Component}`);
    content = await getPublish(Component, Provider);
  }

  if (content.Properties) {
    return publicCheckYaml(content.Properties, Properties);
  } else {
    return null;
  }
}
export default validateProps;
