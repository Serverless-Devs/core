import YAML from 'yaml';
import { YAMLMap, Pair, Scalar } from 'yaml/types';
import fs from 'fs';
import i18next from 'i18next';
console.log('*'.repeat(100));

(async () => {
  const file = fs.readFileSync('yaml/s.yaml', 'utf8');
  const doc = YAML.parseDocument(file);
  const yamlJson = doc.contents.toJSON();
  const instance = i18next.createInstance();
  await instance.init({
    lng: 'en', // if you're using a language detector, do not define the lng option
    // debug: true,
    resources: {
      en: {
        translation: yamlJson
      }
    },
    interpolation: {
      prefix: "${",
      suffix: "}"
    }
  });

  console.log(i18next.t('services.helloworld.props.region', {
    vars:{
      region: 'xxx-cnnhs'
    }
  }));


  if (doc.contents instanceof YAMLMap) {
    const { items } = doc.contents;
    for (const item of items) {
      iteratorPair(item);
    }
  }

  function iteratorPair(item: Pair | YAMLMap | Scalar) {
    if (item instanceof Pair) {
      if (item.value.type === 'MAP') {
        for (const obj of item.value.items) {
          iteratorPair(obj);
        }
        return;
      }
      if (item.value.type === 'SEQ') {
        for (const obj of item.value.items) {
          iteratorPair(obj);
        }
        return;
      }
      if (item.value.value === '${vars.region}') {
        item.value.value = 'my region';
      }
      console.log(item.key.value, item.value.value);
    }
    if (item instanceof YAMLMap) {
      for (const obj of item.items) {
        iteratorPair(obj);
      }
    }

    if (item instanceof Scalar) {
      console.log(item.value);
    }
  }

  fs.writeFileSync('yaml/new.yaml', doc.toString());
})()


