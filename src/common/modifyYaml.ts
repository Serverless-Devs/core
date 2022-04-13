import YAML, { Document } from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { get, find, isEmpty, merge } from 'lodash';
// import { COMMON_VARIABLE_TYPE_REG } from './constant';
// TODO: 对于拼接的变量如何更改
const COMMON_VARIABLE_TYPE_REG = new RegExp(/\$\{(.*)\}/, 'i');

class ModifyYaml {
  private doc: Document.Parsed;
  private data: object;
  private globalKeys: { [key: string]: any }[] = [];
  private variableList: { key: string; value: any }[] = [];
  constructor(json: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
    this.data = merge(this.doc.toJSON(), json);
  }
  init() {
    const newDoc = YAML.parseDocument(YAML.stringify(this.data));
    const { contents: oldContents } = this.doc;
    this.setKey(newDoc, this.doc);

    if (oldContents instanceof YAMLMap) {
      const { items } = oldContents;
      for (const item of items) {
        this.iteratorPair(item, item.key.value);
      }
    }
    const { contents: newContents } = newDoc;
    this.setKey(newContents, oldContents);
    if (newContents instanceof YAMLMap) {
      const { items } = newContents;
      for (const item of items) {
        this.setComment(item, item.key.value);
        // 对变量进行重新赋值
        this.setVariablePair(item, item.key.value);
      }
    }
    return newDoc.toString();
  }

  addKey(item: Pair | YAMLMap | Scalar, key: string) {
    const findObj = find(this.globalKeys, (o) => o.key === key);
    if (findObj) return;
    this.globalKeys.push({
      key,
      comment: item.comment,
      commentBefore: item.commentBefore,
      range: item.range,
      spaceBefore: item.spaceBefore,
    });
  }
  setKey(newVal, oldVal) {
    if (isEmpty(oldVal)) return;
    newVal.comment = oldVal.comment;
    newVal.commentBefore = oldVal.commentBefore;
    newVal.range = oldVal.range;
    newVal.spaceBefore = oldVal.spaceBefore;
  }
  setComment(item: Pair | YAMLMap, preKey: string) {
    const findObj = find(this.globalKeys, (o) => o.key === preKey);
    this.setKey(item, findObj);
    if (item instanceof Pair) {
      if (item.value.type === 'MAP') {
        preKey += '.';
        for (const obj of item.value.items) {
          this.setComment(obj, preKey + obj.key.value);
        }
      }
      if (item.value.type === 'SEQ') {
        for (const index in item.value.items) {
          const obj = item.value.items[index];
          this.setComment(obj, preKey + `[${index}]`);
        }
      }
    }
    if (item instanceof YAMLMap) {
      preKey += '.';
      for (const obj of item.items) {
        this.setComment(obj, preKey + obj.key.value);
      }
    }
  }

  iteratorPair(item: Pair | YAMLMap | Scalar, preKey: string) {
    this.addKey(item, preKey);
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
      this.getPairValue(item, preKey);
    }
    if (item instanceof YAMLMap) {
      preKey += '.';
      for (const obj of item.items) {
        this.iteratorPair(obj, preKey + obj.key.value);
      }
    }

    if (item instanceof Scalar) {
      this.getScalarValue(item, preKey);
    }
  }
  setVariablePair(item: Pair | YAMLMap, preKey: string) {
    this.setVariable(item, preKey);
    if (item instanceof Pair) {
      if (item.value.type === 'MAP') {
        preKey += '.';
        for (const obj of item.value.items) {
          this.setVariablePair(obj, preKey + obj.key.value);
        }
        return;
      }
      if (item.value.type === 'SEQ') {
        for (const index in item.value.items) {
          const obj = item.value.items[index];
          this.setVariablePair(obj, preKey + `[${index}]`);
        }
        return;
      }
    }
    if (item instanceof YAMLMap) {
      preKey += '.';
      for (const obj of item.items) {
        this.setVariablePair(obj, preKey + obj.key.value);
      }
    }
  }
  matchVariable(value: string) {
    if (typeof value !== 'string') return;
    return value.match(COMMON_VARIABLE_TYPE_REG);
  }
  addVariable(key: string, value: any) {
    const findObj = find(this.variableList, (o) => o.key === key);
    if (findObj) return;
    this.variableList.push({ key, value });
  }
  getPairValue(item: Pair, preKey: string) {
    const regResult = this.matchVariable(item.value.value);
    if (regResult) {
      this.addVariable(preKey, regResult[0]);
      const value = get(this.data, preKey);
      // newJson 新值（非merge来的变量）
      !this.matchVariable(value) && this.addVariable(regResult[1], value);
    }
  }
  setVariable(item: any, preKey: string) {
    const findObj = find(this.variableList, (o) => o.key === preKey);
    if (findObj) {
      item.value = YAML.createNode(findObj.value);
    }
  }
  getScalarValue(item: Scalar, preKey: string) {
    const regResult = this.matchVariable(item.value);
    if (regResult) {
      this.addVariable(preKey, regResult[0]);
      const value = get(this.data, preKey);
      // newJson 新值（非merge来的变量）
      !this.matchVariable(value) && this.addVariable(regResult[1], value);
    }
  }
}

function modifyYaml(json: object, yamlData: string) {
  return new ModifyYaml(json, yamlData).init();
}

export default modifyYaml;
