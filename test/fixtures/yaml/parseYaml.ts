import { parseYaml } from "../../../src";

const doc = parseYaml('yaml/s.yaml')
console.log(JSON.stringify(doc, null, 2));
