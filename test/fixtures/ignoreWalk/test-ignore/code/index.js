'use strict';

exports.handler = (event, context, callback) => {
    const str = `functionName: ${context.function.name}`;
    // console.log('accountId: ', context.accountId);
    // console.log('accessKeyId: ', context.credentials.accessKeyId);
    // console.log('accessKeySecret: ', context.credentials.accessKeySecret);
    // console.log('securityToken: ', context.credentials.securityToken);
    console.log(str);
    callback(null, str);
}