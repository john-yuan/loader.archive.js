/**
 * 保存构建信息
 */

const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {
        let saveBuildId = runtime.config.saveBuildId;

        if (saveBuildId) {
            let saveBuildIdPath = path.resolve(runtime.tempDir, saveBuildId);
            if (fse.pathExistsSync(saveBuildIdPath)) {
                printUtils.error(`保存构建编号失败, 用于保存构建编号的文件 ${saveBuildId} 已存在!`);
                throw new Error();
            }
            try {
                fse.outputFileSync(saveBuildIdPath, runtime.buildUUID);
            } catch(e) {
                printUtils.error('保存构建编号失败!');
                throw e;
            }
        }

        let saveBuildInfo = runtime.config.saveBuildInfo;

        if (saveBuildInfo) {
            let saveBuildInfoPath = path.resolve(runtime.tempDir, saveBuildInfo);
            if (fse.pathExistsSync(saveBuildInfoPath)) {
                printUtils.error(`保存构建信息失败, 用于保存构建信息的文件 ${saveBuildInfo} 已存在!`);
                throw new Error();
            }
            try {
                fse.outputFileSync(saveBuildInfoPath, runtime.buildInfoText);
            } catch(e) {
                printUtils.error('保存构建信息失败!');
                throw e;
            }
        }

        resolve(runtime);
    });
};