import YAML, { Document } from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { isBoolean, isNumber, get, find } from 'lodash';
import { COMMON_VARIABLE_TYPE_REG } from './constant';

class ModifyYaml {
  private doc: Document.Parsed;
  private data: object;
  private variableList: { key: string; value: any }[] = [];
  constructor(json: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
    this.data = json;
  }
  init() {
    const { contents } = this.doc;
    if (contents instanceof YAMLMap) {
      const { items } = contents;
      //  收集变量 variableList
      for (const item of items) {
        this.iteratorPair(item, item.key.value);
      }
      //  对变量进行重新赋值
      for (const item of items) {
        this.iteratorVars(item, item.key.value);
      }
    }
    return this.doc.toString();
  }

  createNode(item: any, val: any) {
    if (val) {
      item.value = YAML.createNode(val);
    }
  }

  iteratorVars(item: Pair | YAMLMap | Scalar, preKey: string) {
    if (item instanceof Pair) {
      if (item.value.type === 'MAP') {
        preKey += '.';
        for (const obj of item.value.items) {
          const findObj = find(this.variableList, (o) => o.key === preKey + obj.key.value);
          this.createNode(obj, get(findObj, 'value'));
        }
      }
    }
  }
  iteratorPair(item: Pair | YAMLMap | Scalar, preKey: string) {
    if (item instanceof Pair) {
      if (item.value.type === 'MAP') {
        preKey += '.';
        for (const obj of item.value.items) {
          this.iteratorPair(obj, preKey + obj.key.value);
        }
        return;
      }
      if (item.value.type === 'SEQ') {
        for (const index in item.value.items) {
          const obj = item.value.items[index];
          this.iteratorPair(obj, preKey + `[${index}]`);
        }
        return;
      }
      this.setPairValue(item, preKey);
    }
    if (item instanceof YAMLMap) {
      preKey += '.';
      for (const obj of item.items) {
        this.iteratorPair(obj, preKey + obj.key.value);
      }
    }

    if (item instanceof Scalar) {
      this.setScalarValue(item, preKey);
    }
  }
  setPairValue(item: Pair, preKey: string) {
    if (isBoolean(item.value.value) || isNumber(item.value.value)) {
      this.createNode(item, get(this.data, preKey));
      return;
    }
    const regResult = item.value.value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      return this.variableList.push({
        key: regResult[1],
        value: get(this.data, preKey),
      });
    }
    this.createNode(item, get(this.data, preKey));
  }
  setScalarValue(item: Scalar, preKey: string) {
    if (isBoolean(item.value) || isNumber(item.value)) {
      this.createNode(item, get(this.data, preKey));
      return;
    }
    const regResult = item.value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      return this.variableList.push({
        key: regResult[1],
        value: get(this.data, preKey),
      });
    }
    this.createNode(item, get(this.data, preKey));
  }
}

function modifyYaml(json: object, yamlData: string) {
  return new ModifyYaml(json, yamlData).init();
}

export default modifyYaml;
