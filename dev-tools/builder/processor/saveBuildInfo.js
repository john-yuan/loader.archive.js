const path = require('path');
const fse = require('fs-extra');
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        if (runtime.config.saveBuildLog) {
            try {
                let saveBuildLog = path.resolve(runtime.wd, runtime.config.saveBuildLog);
                if (fse.pathExistsSync(saveBuildLog)) {
                    saveBuildLog = utils.shortName(runtime.wd, saveBuildLog);
                    return reject(new Error(`保存构建序列失败, 文件已存在! ${saveBuildLog}`));
                }
                let printData = printUtils.getData();
                let outputList = printData.outputList;
                let warnList = printData.warnList;
                if (runtime.buildResult) {
                    outputList.push('');
                    outputList.push(runtime.buildResult);
                }
                if (warnList.length) {
                    outputList.push('');
                    outputList = outputList.concat(warnList);
                    outputList.push('');
                }
                outputList.push(`保存到 ${runtime.out}`);
                outputList.push(`构建完成!`);
                fse.outputFileSync(saveBuildLog, outputList.join('\n'));
            } catch (e) {
                return reject(new Error(`保存构建序列失败!\n${e.stack}`));
            }
        }
        if (runtime.config.saveSerialNo) {
            try {
                let saveSerialNo = path.resolve(runtime.wd, runtime.config.saveSerialNo);
                if (fse.pathExistsSync(saveSerialNo)) {
                    saveSerialNo = utils.shortName(runtime.wd, saveSerialNo);
                    return reject(new Error(`保存构建序列失败, 文件已存在! ${saveSerialNo}`));
                }
                fse.outputFileSync(saveSerialNo, runtime.serialNo);
            } catch (e) {
                return reject(new Error(`保存构建序列失败!\n${e.stack}`));
            }
        }
        if (runtime.config.saveBuildResult) {
            try {
                let saveBuildResult = path.resolve(runtime.wd, runtime.config.saveBuildResult);
                if (fse.pathExistsSync(saveBuildResult)) {
                    saveBuildResult = utils.shortName(runtime.wd, saveBuildResult);
                    return reject(new Error(`保存构建结果失败, 文件已存在! ${saveBuildResult}`));
                }
                fse.outputFileSync(saveBuildResult, runtime.buildResult);
                delete runtime.buildResult;
            } catch (e) {
                return reject(new Error(`保存构建结果失败!\n${e.stack}`));
            }
        }
        if (runtime.config.saveBuildInfo) {
            try {
                let saveBuildInfo = path.resolve(runtime.wd, runtime.config.saveBuildInfo);
                if (fse.pathExistsSync(saveBuildInfo)) {
                    saveBuildInfo = utils.shortName(runtime.wd, saveBuildInfo);
                    return reject(new Error(`保存构建信息失败, 文件已存在! ${saveBuildInfo}`));
                }
                fse.outputFileSync(saveBuildInfo, JSON.stringify(runtime, null, 4))
            } catch (e) {
                return reject(new Error(`保存构建信息失败!\n${e.stack}`));
            }
        }

        resolve(runtime);
    });
};

module.exports = main;
