import YAML, { Document } from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { find, isEmpty, get } from 'lodash';
import extend2 from 'extend2';

class ModifyYaml {
  private doc: Document.Parsed;
  private data: object;
  private globalKeys: { [key: string]: any }[] = [];
  constructor(json: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
    // 新的json和原有的yaml数据进行合并，拿到一个最全的数据
    this.data = extend2(true, this.doc.toJSON(), json);
    if (get(json, 'vars')) {
      this.data = { ...this.data, vars: get(json, 'vars') };
    }
  }
  init() {
    const newDoc = YAML.parseDocument(YAML.stringify(this.data));
    const { contents: oldContents } = this.doc;
    this.setKey(newDoc, this.doc);

    // 对老的yaml收集注释信息等
    if (oldContents instanceof YAMLMap) {
      const { items } = oldContents;
      for (const item of items) {
        this.iteratorPair(item, item.key.value);
      }
    }
    // 对新的数据设置注释信息等
    const { contents: newContents } = newDoc;
    this.setKey(newContents, oldContents);
    if (newContents instanceof YAMLMap) {
      const { items } = newContents;
      for (const item of items) {
        this.setComment(item, item.key.value);
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
      if (item.value.type === 'PLAIN') {
        this.setComment(item.value, preKey + '.value');
        return;
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
      if (item.value.type === 'PLAIN') {
        this.iteratorPair(item.value, preKey + '.value');
        return;
      }
    }
    if (item instanceof YAMLMap) {
      preKey += '.';
      for (const obj of item.items) {
        this.iteratorPair(obj, preKey + obj.key.value);
      }
    }
  }
}

function modifyYaml(json: object, yamlData: string) {
  return new ModifyYaml(json, yamlData).init();
}

export default modifyYaml;
