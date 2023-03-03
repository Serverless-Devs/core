import os from 'os';
import path from 'path';

export type IRegistry =
  | 'http://registry.devsapp.cn/simple'
  | 'https://api.github.com/repos'
  | 'http://registry.serverlessfans.cn/simple';

export enum RegistryEnum {
  github = 'https://api.github.com/repos',
  serverlessOld = 'http://registry.serverlessfans.cn/simple',
  serverless = 'http://registry.devsapp.cn/simple',
}

export const DEFAULT_REGIRSTRY = 'http://registry.devsapp.cn/simple';

export const FC_COMPONENT = [
  'domain',
  'fc',
  'fc-api',
  'fc-common',
  'fc-core',
  'fc-default',
  'fc-deploy',
  'fc-info',
  'fc-plan',
  'oss',
];

export const COMMON_VARIABLE_TYPE_REG = new RegExp(/\$\{(.*?)\}/, 'g');

export const SPECIALL_VARIABLE_TYPE_REG = new RegExp(/(.*)\((.*)\)/, 'i');

export const ALIYUN_CLI = '${aliyun-cli}';

export const RANDOM_PATTERN = '${default-suffix}';

export const ALIYUN_CONFIG_FILE = path.join(os.homedir(), '.aliyun', 'config.json');

export const CONFIG_PROVIDERS = [
  {
    label: 'Alibaba Cloud (alibaba)',
    value: 'alibaba',
  },
  {
    label: 'AWS (aws)',
    value: 'aws',
  },
  {
    label: 'Azure (azure)',
    value: 'azure',
  },
  {
    label: 'Baidu Cloud (baidu)',
    value: 'baidu',
  },
  {
    label: 'Google Cloud (google)',
    value: 'google',
  },
  {
    label: 'Huawei Cloud (huawei)',
    value: 'huawei',
  },
  {
    label: 'Tencent Cloud (tencent)',
    value: 'tencent',
  },
  {
    label: 'Custom (others)',
    value: 'custom',
  },
];

export const CONFIG_ACCESS = {
  alibaba: ['AccessKeyID', 'AccessKeySecret'],
  aws: ['AccessKeyID', 'SecretAccessKey'],
  huawei: ['AccessKeyID', 'SecretAccessKey'],
  azure: ['KeyVaultName', 'TenantID', 'ClentID', 'ClientSecret'],
  baidu: ['AccessKeyID', 'SecretAccessKey'],
  google: ['PrivateKeyData'],
  tencent: ['AccountID', 'SecretID', 'SecretKey'],
};

export const INIT_PROVIDERS = [
  {
    label: 'Alibaba Cloud Serverless',
    value: 'Alibaba_Cloud_Serverless',
  },
  {
    label: 'AWS Cloud Serverless',
    value: 'devscomp/start-lambda',
  },
  {
    label: 'Tencent Cloud Serverless',
    value: 'devscomp/start-scf',
  },
  {
    label: 'Huawei Cloud Serverless',
    value: 'xinwuyun/start-fg',
  },
  {
    label: 'Baidu Cloud Serverless',
    value: 'xinwuyun/start-cfc',
  },
  {
    label: 'Dev Template for Serverless Devs',
    value: 'Dev_Template_for_Serverless_Devs',
  },
];

export const INIT_TEMPLATE = {
  Alibaba_Cloud_Serverless: [
    {
      label: 'Quick start [Deploy a Hello World function to FaaS]',
      value: 'quick_start',
    },
    {
      label: 'Container example [Deploy function to FaaS with custom-container]',
      value: 'container_example',
    },
    {
      label: 'Web Framework [Deploy a web framework to FaaS]',
      value: 'web_framework',
    },
    {
      label: 'Static website [Deploy a static website]',
      value: 'static_website',
    },
    {
      label: 'Best practice [Experience serverless project]',
      value: 'best_practice',
    },
  ],
};

export const INIT_ALI_TEMPLATE = {
  quick_start: [
    {
      label: '[HTTP] Node.js 14',
      value: 'devsapp/start-fc-http-nodejs14',
      isDeploy: true,
    },
    {
      label: '[HTTP] Python3',
      value: 'devsapp/start-fc-http-python3',
      isDeploy: true,
    },
    {
      label: '[HTTP] Java8',
      value: 'devsapp/start-fc-http-java8',
    },
    {
      label: '[HTTP] PHP7',
      value: 'devsapp/start-fc-http-php7',
      isDeploy: true,
    },
    {
      label: '[HTTP] C++ (custom)',
      value: 'devsapp/fc-custom-cpp-http',
      isDeploy: true,
    },
    {
      label: '[Event] Node.js 14',
      value: 'devsapp/start-fc-event-nodejs14',
      isDeploy: true,
    },
    {
      label: '[Event] Python3',
      value: 'devsapp/start-fc-event-python3',
      isDeploy: true,
    },
    {
      label: '[Event] Java8',
      value: 'devsapp/start-fc-event-java8',
    },
    {
      label: '[Event] PHP7',
      value: 'devsapp/start-fc-event-php7',
      isDeploy: true,
    },
    {
      label: '[Event] Go (custom)',
      value: 'devsapp/fc-custom-golang-event',
    },
    {
      label: '[Event] Powershell (custom)',
      value: 'devsapp/fc-custom-powershell-event',
    },
    {
      label: '[Event] Typescript (custom)',
      value: 'devsapp/fc-custom-typescript-event',
    },
    {
      label: '[Event] Lua (custom)',
      value: 'devsapp/fc-custom-lua-event',
    },
    {
      label: '[Event] Ruby (custom)',
      value: 'devsapp/fc-custom-ruby-event',
    },
    {
      label: '[Event] Rust (custom)',
      value: 'devsapp/fc-custom-rust-event',
    },
    {
      label: '[Event] Dart (custom)',
      value: 'devsapp/fc-custom-dart-event',
    },
  ],
  container_example: [
    {
      label: '[HTTP] C++',
      value: 'devsapp/start-fc-custom-container-http-cpp',
    },
    {
      label: '[HTTP] Java (Springboot)',
      value: 'devsapp/start-fc-custom-container-http-springboot',
    },
    {
      label: '[HTTP] ASP.NET Core',
      value: 'devsapp/start-fc-custom-container-http-aspdotnetcore',
    },
    {
      label: '[Event] Node.js 14',
      value: 'devsapp/start-fc-custom-container-event-nodejs14',
      isDeploy: true,
    },
    {
      label: '[Event] Python3.9',
      value: 'devsapp/start-fc-custom-container-event-python3.9',
    },
    {
      label: '[Event] C++',
      value: 'devsapp/start-fc-custom-container-event-cpp',
    },
  ],
  web_framework: [
    {
      label: 'Express.js',
      value: 'devsapp/start-express',
      isDeploy: true,
    },
    {
      label: 'Egg.js',
      value: 'devsapp/start-egg',
      isDeploy: true,
    },
    {
      label: 'Koa.js',
      value: 'devsapp/start-koa',
    },
    {
      label: 'Nuxt.js (SSR)',
      value: 'devsapp/start-nuxt-ssr',
      isDeploy: true,
    },
    {
      label: 'Next.js (SSR)',
      value: 'devsapp/start-next-ssr',
      isDeploy: true,
    },
    {
      label: 'Django',
      value: 'devsapp/start-django',
      isDeploy: true,
    },
    {
      label: 'Flask',
      value: 'devsapp/start-flask',
      isDeploy: true,
    },
    {
      label: 'Tornado',
      value: 'devsapp/start-tornado',
      isDeploy: true,
    },
    {
      label: 'Springboot',
      value: 'devsapp/start-springboot',
    },
    {
      label: 'ThinkPHP',
      value: 'devsapp/start-thinkphp',
    },
    {
      label: 'Laravel',
      value: 'devsapp/start-laravel',
    },
  ],
  static_website: [
    {
      label: 'Docusaurus',
      value: 'devsapp/website-docusaurus',
      isDeploy: true,
    },
    {
      label: 'Hexo',
      value: 'devsapp/website-hexo',
      isDeploy: true,
    },
    {
      label: 'Vuepress',
      value: 'devsapp/website-vuepress',
      isDeploy: true,
    },
  ],
  best_practice: [
    {
      label: '[AI] PyTorch',
      value: 'devsapp/start-pytorch',
      isDeploy: true,
    },
    {
      label: '[AI] Tensorflow',
      value: 'devsapp/start-tensorflow',
      isDeploy: true,
    },
    {
      label: '[AI] Image Prediction',
      value: 'devsapp/image-prediction-app',
      isDeploy: true,
    },
    {
      label: '[DB] MySQL Example',
      value: 'devsapp/start-fc-mysql-python',
    },
    {
      label: '[DB] MongoDB Example',
      value: 'devsapp/start-fc-mongodb-python',
    },
    {
      label: '[DB] Redis Example',
      value: 'devsapp start-fc-redis-python',
    },
    {
      label: 'Puppeteer Example',
      value: 'devsapp/puppeteer-nodejs',
    },
    {
      label: 'FFmpeg Example',
      value: 'devsapp/ffmpeg-app',
    },
    {
      label: 'Mall admin Example',
      value: 'devsapp/start-fc-mall-admin',
    },
  ],
};

export const INIT_DEVS_TEMPLATE = [
  {
    label: 'Application Scaffolding',
    value: 'devsapp/start-application',
  },
  {
    label: 'Component Scaffolding',
    value: 'devsapp/start-component',
  },
  {
    label: 'Plugin Scaffolding',
    value: 'devsapp/start-plugin',
  },
];
