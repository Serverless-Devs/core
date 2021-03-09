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
  return errors.length > 0 ? [true, errors] : [false, null];
}
export default publicCheckYaml;
