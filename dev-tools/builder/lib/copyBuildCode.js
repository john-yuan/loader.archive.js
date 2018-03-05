/**
 * 复制构建代码至输出目录
 */

const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        fse.remove(runtime.out, function(err) {
            if (err) {
                printUtils.error(`清理输出目录失败! ${runtime.out}`);
            } else {
                fse.move(runtime.tempDir, runtime.out, function(err) {
                    if (err) {
                        printUtils.error('保存构建结果失败!');
                        throw err;
                    } else {
                        resolve(runtime);
                    }
                });
            }
        });
    });
};