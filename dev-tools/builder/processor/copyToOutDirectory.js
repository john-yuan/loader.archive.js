const fse = require('fs-extra');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        printUtils.info(`保存到 ${runtime.out}`);
        fse.remove(runtime.out).then(() => {
            fse.move(runtime.wd, runtime.out).then(() => {
                resolve(runtime);
                printUtils.info(`构建完成!`);
                console.log();
            }).catch(err => {
                reject(new Error(`移动构建结果至输出目录失败!\n${err.stack}`));
            });
        }).catch(err => {
            reject(new Error(`移除输出目录失败!\n${err.stack}`));
        });
    });
};

module.exports = main;
