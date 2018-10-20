const fse = require('fs-extra');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        printUtils.info(`复制 ${runtime.in} => ${runtime.wd}`);
        fse.copy(runtime.in, runtime.wd).then(() => {
            resolve(runtime);
        }).catch(err => {
            reject(new Error(`复制源代码失败!\n${err.stack}`));
        });
    });
};

module.exports = main;
