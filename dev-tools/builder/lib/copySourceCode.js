/**
 * 复制源代码至临时目录
 */

const fse = require('fs-extra');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        fse.copy(runtime.in, runtime.tempDir, function(err) {
            if (err) {
                printUtils.error('复制源代码失败!');
                reject(err);
            } else {
                printUtils.info('复制源代码完成!');
                resolve(runtime);
            }
        });
    });
};