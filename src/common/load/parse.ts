import YAML, { Document } from 'yaml';
import { YAMLMap } from 'yaml/types';
import { get } from 'lodash';
class ParseYaml {
  private doc: Document.Parsed;
  constructor(private newJson: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
  }
  init() {
    const { contents } = this.doc;
    if (contents instanceof YAMLMap) {
      const { items } = contents;
      const appName = get(this.newJson, 'appName');
      for (const item of items) {
        if (item.key.value === 'name' && appName) {
          item.value = YAML.createNode(appName);
        }
      }
    }
    return this.doc.toString();
  }
}

function parse(newJson: object, yamlData: string) {
  return new ParseYaml(newJson, yamlData).init();
}

export default parse;
