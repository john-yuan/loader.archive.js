const path = require('path');
const fse = require('fs-extra');
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let deleteFiles = runtime.config.deleteFiles || [];
        let deleteFile = () => {
            if (deleteFiles.length) {
                let filename = deleteFiles.shift();
                filename = path.resolve(runtime.wd, filename);
                fse.remove(filename).then(() => {
                    printUtils.info(`删除 ${utils.shortName(runtime.wd, filename)}`);
                    deleteFile();
                }).catch(err => {
                    reject(new Error(`删除文件失败!\n${err.stack}`));
                });
            } else {
                resolve(runtime);
            }
        };
        deleteFile();
    });
};

module.exports = main;
