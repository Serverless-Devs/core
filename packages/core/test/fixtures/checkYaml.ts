import { validateProps } from '../../src/common';

const input = {
  Provider: 'alibaba',
  Component: '/Users/shihuali/learn/fc-atom/fc-ram-alibaba-component/dist/index.js',
  // Component: 'fc@0.1.1',
  // Component: 'fc',
  Properties: {
    Region: 'cn-hangzhouxx',
    Service: {
      // Name: 'xx',
      Log: {
        LogStore: '',
        Project: 'xx',
      },
      Nas: [
        {
          label: 'xx',
          value: 'xx',
        },
        {
          label: '',
          value: 'xx',
        },
      ],
    },
  },
};

async function test() {
  const errors = await validateProps(input);
  console.log(errors);
}

test();
