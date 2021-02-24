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

  args() {
    return this.component.args({
      args: '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz',
    });
  }
}

const demo = new CredentialsDemo();
demo.credentials();
// console.log(demo.args());
