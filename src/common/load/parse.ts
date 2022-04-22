import YAML, { Document } from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { get, trim } from 'lodash';
const defaultTagRE = /\{\{(.*?)\}\}/;

class ParseYaml {
  private doc: Document.Parsed;
  constructor(private newJson: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
  }
  init() {
    const { contents } = this.doc;
    if (contents instanceof YAMLMap) {
      const { items } = contents;
      const _appName = get(this.newJson, '_appName');
      for (const item of items) {
        this.iteratorPair(item);
        if (item.key.value === 'name' && _appName) {
          item.value = YAML.createNode(_appName);
        }
      }
    }
    return this.doc.toString();
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
    const regResult = defaultTagRE.exec(value);
    if (regResult && this.newJson.hasOwnProperty(trim(regResult[1]))) {
      item.value = YAML.createNode(this.newJson[trim(regResult[1])]);
    }
  }
  setScalarValue(item: Scalar) {
    const regResult = defaultTagRE.exec(item.value);
    if (regResult && this.newJson.hasOwnProperty(trim(regResult[1]))) {
      item.value = this.newJson[trim(regResult[1])];
    }
  }
}

function parse(newJson: object, yamlData: string) {
  return new ParseYaml(newJson, yamlData).init();
}

export default parse;
