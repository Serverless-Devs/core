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
async function checkYaml(publish, input, prefix?: string) {
  Object.keys(publish).forEach((a) => {
    const errorKey = prefix ? `${prefix}.${a}` : a;
    if (publish[a].Required) {
      if (input[a]) {
        const { Type } = publish[a];
        if (Type.length > 1) {
          let errorCount = 0;
          Type.forEach((item) => {
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
                  checkYaml(value, input[a], errorKey);
                } else {
                  errorCount += 1;
                }
              }
            }
          });
          if (errorCount === Type.length) {
            throw new Error(`${errorKey}的值不正确`);
          }
        } else {
          const item = Type[0];
          // string, boolean, number, List<string>
          if (typeof item === 'string') {
            if (BaseType[item].includes('array-')) {
              if (Array.isArray(input[a])) {
                input[a].forEach((b) => {
                  if (typeof b !== BaseType[item].split('-')[1]) {
                    throw new Error(`${errorKey}的类型是 ${item}`);
                  }
                });
              } else {
                throw new Error(`${errorKey}的类型是 ${item}`);
              }
            } else if (typeof input[a] !== BaseType[item]) {
              throw new Error(`${errorKey}的类型是 ${item}`);
            }
          } else {
            // object, key为 Enum, Struct List
            const { key, value } = getKeys(item);
            if (key.includes('Enum')) {
              const filterList = value.filter((obj) => obj === input[a]);
              if (filterList.length === 0) {
                throw new Error(`${errorKey}的值是 [${value}]`);
              }
            } else if (key.includes('Struct')) {
              if (typeof input[a] === 'object') {
                checkYaml(value, input[a], errorKey);
              } else {
                throw new Error(`${errorKey}的值是 object`);
              }
            } else if (key.includes('List')) {
              if (Array.isArray(input[a])) {
                input[a].forEach((b) => {
                  checkYaml(value, b, `${errorKey}[]`);
                });
              } else {
                throw new Error(`${errorKey}的值是 List`);
              }
            }
          }
        }
      } else {
        throw Error(`${errorKey}是必填字段`);
      }
    }
  });
  return true;
}
export default checkYaml;
