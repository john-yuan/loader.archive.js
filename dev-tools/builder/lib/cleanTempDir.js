/**
 * 删除临时构建目录
 */

const fse = require('fs-extra');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        fse.remove(runtime.tempDir, function(err) {
            if (err) {
                printUtils.error(`删除临时目录失败! ${runtime.tempDir}`);
                reject(err);
            } else {
                resolve(runtime);
            }
        })
    });
};