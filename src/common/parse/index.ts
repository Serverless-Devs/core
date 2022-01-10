import { getTemplatePath } from './utils';

interface IConfigs {
  syaml: string;
}

async function parse(configs: IConfigs) {
  const { syaml } = configs;
  const spath = await getTemplatePath(syaml);
  console.log(spath);
}

export default parse;
