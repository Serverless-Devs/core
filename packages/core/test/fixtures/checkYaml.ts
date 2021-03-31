import { validateProps } from '../../src/common';

const input = {
  Provider: 'alibaba',
  Component: '/Users/shihuali/learn/fc-atom/fc-ram-alibaba-component/dist/index.js',
  // Component: 'fc@0.1.1',
  // Component: 'fc',
  Properties: {
    Region: 'cn-hangzhouxx',
    Service: {
      Name: 'xx',
      Log: {
        LogStore: 'xx',
        Project: '',
      },
      Nas: [
        {
          label: 'xx',
          value: [{ name: 'xx', age: '20' }],
        },
        {
          label: 'xx',
          value: [{ name: 'xx', age: '20' }],
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
