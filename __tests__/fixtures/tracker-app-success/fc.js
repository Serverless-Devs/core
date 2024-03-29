const { setTrackerData } = require('../../../src');
const { get } = require('lodash');

class FC {
  deploy(inputs) {
    setTrackerData('fc', {
      uid: get(inputs, 'credentials.AccountID'),
      region: get(inputs, 'props.region'),
      service: get(inputs, 'props.service.name'),
      function: get(inputs, 'props.function.name'),
    });
    return { message: 'this is a local fc' };
  }
}

module.exports = FC;
