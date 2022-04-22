import YAML, { Document } from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { isBoolean, isNumber, get, isEmpty } from 'lodash';
import { COMMON_VARIABLE_TYPE_REG } from './constant';
class ParseYaml {
  private doc: Document.Parsed;
  private yamlJson: any;
  constructor(data: string) {
    this.doc = YAML.parseDocument(data);
    this.yamlJson = this.doc.contents.toJSON();
  }
  init() {
    const { contents } = this.doc;
    if (contents instanceof YAMLMap) {
      const { items } = contents;
      for (const item of items) {
        this.iteratorPair(item);
      }
    }
    return this.doc.toJSON();
  }
  iteratorPair(item: Pair | YAMLMap | Scalar) {
    if (item instanceof Pair) {
      const type = get(item, 'value.type');
      if (type === 'MAP' || type === 'SEQ') {
        for (const obj of item.value.items) {
          this.iteratorPair(obj);
        }
        return;
      }
      this.setPairValue(item);
    }
    if (item instanceof YAMLMap) {
      for (const obj of item.items) {
        this.iteratorPair(obj);
      }
    }

    if (item instanceof Scalar) {
      this.setScalarValue(item);
    }
  }
  setPairValue(item: Pair) {
    const value = get(item, 'value.value');
    if (isBoolean(value) || isNumber(value) || isEmpty(value)) return;
    const regResult = value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      const tmp = this.getRealValue(value, regResult);
      item.value = YAML.createNode(tmp);
    }
  }
  getRealValue(value, regResult) {
    let tmp = value;
    for (const iterator of regResult) {
      const realValue = get(
        this.yamlJson,
        iterator.replace(COMMON_VARIABLE_TYPE_REG, '$1'),
        iterator,
      );
      tmp = typeof realValue === 'string' ? tmp.replace(iterator, realValue) : realValue;
    }
    return tmp;
  }
  setScalarValue(item: Scalar) {
    if (isBoolean(item.value) || isNumber(item.value) || isEmpty(item.value)) return;
    const regResult = item.value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      item.value = this.getRealValue(item.value, regResult);
    }
  }
}

function parseYaml(data: string) {
  return new ParseYaml(data).init();
}

export default parseYaml;
