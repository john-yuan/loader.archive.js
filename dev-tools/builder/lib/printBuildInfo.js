/**
 * 打印构建信息
 */

const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        printUtils.info('构建完成!');
        console.log('\n' + runtime.buildInfoText + '\n');
        resolve(runtime);
    });
};