import { parseYaml } from "../../../src";
import fs from 'fs-extra';


const data = fs.readFileSync('yaml/s.yaml', 'utf8');

const doc = parseYaml(data)
console.log(JSON.stringify(doc, null, 2));
