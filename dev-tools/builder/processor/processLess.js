const fs = require('fs');
const path = require('path');
const minifyCss = require('./minifyCss');
const utils = require('../../common/utils');
const walkDirSync = require('../../common/walkDirSync');
const printUtils = require('../../common/printUtils');

const compress = function (runtime, filepath, shortName, mixinTextContent) {
    let cssText;

    printUtils.subInfo(`压缩 ${shortName}`);

    try {
        cssText = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取文件内容失败! ${shortName}\n${e.stack}`);
    }

    if (shortName.indexOf('views/') === 0) {
        let namespace = `.v-` + shortName.split(/\/+/).slice(1, -1).join("-");
        cssText = `${namespace} {\n ${cssText} \n}`;
    }

    cssText = mixinTextContent + cssText;

    cssText = minifyCss(runtime.wd, runtime.wd, shortName, cssText, {
        compressLess: true,
        autoprefixerBrowsers: runtime.config.autoprefixerBrowsers,
        prodSrcPrefix: runtime.config.prodSrcPrefix,
        imageDataUriSize: runtime.config.imageDataUriSize
    });

    try {
        fs.writeFileSync(filepath, cssText);
    } catch (e) {
        throw new Error(`保存文件失败! ${shortName}\n${e.stack}`);
    }
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let mixinTextContent;
        let mixinPath = 'runtime/mixin.less';
        let mixinFullPath = path.resolve(runtime.wdBaseDir, mixinPath);

        try {
            mixinTextContent = fs.readFileSync(mixinFullPath).toString() + '\n';
        } catch (e) {
            return reject(new Error(`读取 mixin 失败, 请检查文件 ${mixinPath} 是否存在!\n${e.stack}`));
        }

        try {
            printUtils.info(`处理 less/css 文件`);
            walkDirSync(runtime.wdBaseDir, filepath => {
                if (/\.less$/.test(filepath)) {
                    let shortName = utils.shortName(runtime.wdBaseDir, filepath);
                    compress(runtime, filepath, shortName, mixinTextContent);
                }
            }, err => {
                throw new Error(`处理 less 文件失败!\n${err.stack}`);
            });
        } catch (e) {
            return reject(e);
        }

        resolve(runtime);
    });
};

module.exports = main;
