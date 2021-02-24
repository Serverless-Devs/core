import { HComponent } from '../../src/decorator';

class CredentialsDemo {
  @HComponent() component;

  async credentials() {
    const input = {
      Args: '',
      State: {},
      Project: {
        ProjectName: 'ExpressComponent',
        Component: 'express',
        // Provider: 'alibaba',
        AccessAlias: 'dankun',
      },
      Properties: {
        Region: 'cn-hangzhou',
        Function: {
          Name: 's-function-1611581703839',
          Description: 'This Function Powered By Serverless Devs Tool',
          Handler: 'index.handler',
          MemorySize: 512,
          Runtime: 'custom',
          Timeout: 60,
          Triggers: [Array],
          CodeUri: './src',
        },
        Service: {
          Name: 's-service',
          Description: 'This Service Powered By Serverless Devs Tool',
        },
      },
    };
    return await this.component.credentials(input);
  }

  async load() {
    await this.component.load('fc@0.1.2', 'alibaba');
  }

  help() {
    const sections = [
      {
        header: 'A typical app',
        content: 'Generates something {italic very} important.',
      },
      {
        header: 'Options',
        optionList: [
          {
            name: 'input',
            typeLabel: '{underline file}',
            description: 'The input to process.',
          },
          {
            name: 'help',
            description: 'Print this usage guide.',
          },
        ],
      },
      {
        header: 'Examples',
        content: [
          {
            desc: '1. A concise example. ',
            example: '$ example -t 100 lib/*.js',
          },
          {
            desc: '2. A long example. ',
            example: '$ example --timeout 100 --src lib/*.js',
          },
          {
            desc:
              '3. This example will scan space for unknown things. Take cure when scanning space, it could take some time. ',
            example:
              '$ example --src galaxy1.facts galaxy1.facts galaxy2.facts galaxy3.facts galaxy4.facts galaxy5.facts',
          },
        ],
      },
    ];
    this.component.help(sections);
  }

  args() {
    return this.component.args({
      args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
    });
  }
}

const demo = new CredentialsDemo();
// demo.load();
demo.credentials();
// demo.help();
// console.log(demo.args());
