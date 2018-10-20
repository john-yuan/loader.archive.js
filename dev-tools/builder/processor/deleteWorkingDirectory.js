const fse = require('fs-extra');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        printUtils.info(`删除 ${runtime.wd}`);
        fse.remove(runtime.wd).then(() => {
            resolve(runtime);
        }).catch(err => {
            reject(new Error(`删除工作目录失败!\n${err.stack}`));
        });
    });
};

module.exports = main;
