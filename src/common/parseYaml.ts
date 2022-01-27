import YAML, { Document } from 'yaml';
import fs from 'fs-extra';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import { isBoolean, isNumber, get } from 'lodash';
const COMMON_VARIABLE_TYPE_REG = new RegExp(/\$\{(.*)\}/, 'i');

class ParseYaml {
  private doc: Document.Parsed;
  private yamlJson: any;
  constructor(yamlPath: string) {
    const file = fs.readFileSync(yamlPath, 'utf8');
    this.doc = YAML.parseDocument(file);
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
      if (item.value.type === 'MAP' || item.value.type === 'SEQ') {
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
    if (isBoolean(item.value.value) || isNumber(item.value.value)) return;
    const regResult = item.value.value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      const realValue = get(this.yamlJson, regResult[1]);
      item.value = YAML.createNode(realValue);
    }
  }
  setScalarValue(item: Scalar) {
    if (isBoolean(item.value) || isNumber(item.value)) return;
    const regResult = item.value.match(COMMON_VARIABLE_TYPE_REG);
    if (regResult) {
      const realValue = get(this.yamlJson, regResult[1]);
      item.value = realValue;
    }
  }
}

function parseYaml(yamlPath: string) {
  return new ParseYaml(yamlPath).init();
}

export default parseYaml;
