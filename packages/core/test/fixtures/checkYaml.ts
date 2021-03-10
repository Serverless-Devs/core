import { checkYaml } from '../../src/common';

// const fc = {
//   Region: {
//     Required: true,
//     Type: [
//       {
//         Enum: ['cn-hangzhou', 'cn-shanghai'],
//       },
//     ],
//   },
//   Service: {
//     Required: false,
//     Type: [
//       {
//         Struct: {
//           Name: {
//             Required: false,
//             Type: ['String'],
//           },
//           Log: {
//             Required: true,
//             Type: [
//               {
//                 'Enum[简单配置/Simple configuration]': ['Auto'],
//               },
//               {
//                 'Struct[详细配置/Detailed configuration]': {
//                   LogStore: {
//                     Required: true,
//                     Description: {
//                       zh: 'loghub中的logstore名称',
//                       en: 'Logstore name in loghub',
//                     },
//                     Type: ['String'],
//                   },
//                   Project: {
//                     Required: true,
//                     Description: {
//                       zh: 'loghub中的project名称',
//                       en: 'Project name in loghub',
//                     },
//                     Type: ['String'],
//                   },
//                 },
//               },
//             ],
//           },
//           Nas: {
//             Required: true,
//             Type: [
//               {
//                 List: {
//                   label: {
//                     Required: true,
//                     Type: ['String'],
//                   },
//                   value: {
//                     Required: true,
//                     Type: ['String'],
//                   },
//                 },
//               },
//             ],
//           },
//         },
//       },
//     ],
//   },
// };

const input = {
  Provider: 'alibaba',
  // Component: '/Users/shihuali/learn/fc-atom/fc-ram-alibaba-component/dist/index.js',
  // Component: 'fc@0.1.1',
  Component: 'fc',
  Properties: {
    Region: 'cn-hangzhoux',
    Service: {
      // Name: 'xx',
      Log: {
        LogStore: '',
        Project: 'xx',
      },
      Nas: [
        {
          label: 'xx',
          value: 'a',
        },
        {
          label: '',
          value: 'a',
        },
      ],
    },
  },
};

async function test() {
  const errors = await checkYaml(input);
  console.log(errors);
}

test();
