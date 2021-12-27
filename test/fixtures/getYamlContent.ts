import { getYamlContent } from '../../src/common';
import { get } from 'lodash';

(async () => {
  const c = await getYamlContent(
    '/Users/shihuali/workspace/core/test/fixtures/modifyProps/s.yml'
  );

  const {services} = c;
  for (const key in services) {
    const element = services[key];
    let environmentVariables = get(element, 'props.function.environmentVariables');
    if (environmentVariables) {
      for (const key1 in environmentVariables) {
        environmentVariables[key1] = '***'
      }
    }
  }

  console.log(JSON.stringify(c, null, 2));
})()