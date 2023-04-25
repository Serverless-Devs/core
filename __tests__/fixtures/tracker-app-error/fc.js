const { setTrackerData } = require('../../../src');
const { get } = require('lodash');

class FC {
  deploy(inputs) {
    const functionName = get(inputs, 'props.function.name');
    // mock 第二个函数抛出错误
    if (functionName === 'next-custom-cpp-event-function') {
      throw new Error('custom error');
    }
    setTrackerData('fc', {
      uid: get(inputs, 'credentials.AccountID'),
      region: get(inputs, 'props.region'),
      service: get(inputs, 'props.service.name'),
      function: functionName,
    });
    return { message: 'this is a local fc' };
  }
}

module.exports = FC;
