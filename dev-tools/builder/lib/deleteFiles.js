/**
 * 打包前需要移除的文件(夹), 相对于 in 目录
 */

const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {
        let deleteFiles = runtime.config.deleteFiles || [];
        let deleteFile = function () {
            if (deleteFiles.length === 0) {
                resolve(runtime);
            } else {
                let filename = deleteFiles.pop();
                let filepath = path.resolve(runtime.tempDir, filename);
                fse.remove(filepath, function (err) {
                    if (err) {
                        printUtils.error(`删除文件失败! ${filepath}`);
                        reject(err);
                    } else {
                        printUtils.info(`删除文件 ${filename}`);
                        deleteFile();
                    }
                });
            }
        };
        deleteFile();
    });
};