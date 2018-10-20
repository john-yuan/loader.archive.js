const fs = require('fs');
const utils = require('../../common/utils');
const walkDirSync = require('../../common/walkDirSync');
const printUtils = require('../../common/printUtils');
const minify = require('html-minifier').minify;

const compress = function (filepath, shortName) {
    let textContent;

    printUtils.subInfo(`压缩 ${shortName}`);

    try {
        textContent = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取 ${shortName} 失败!\n${e.stack}`);
    }

    try {
        textContent = minify(textContent, {
            removeComments: true,
            collapseWhitespace: true
        });
    } catch (e) {
        throw new Error(`压缩 ${shortName} 失败!\n${e.stack}`);
    }

    try {
        fs.writeFileSync(filepath, textContent);
    } catch (e) {
        throw new Error(`保存 ${shortName} 失败!\n${e.stack}`);
    }
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        try {
            printUtils.info(`处理 tpl 文件`);
            walkDirSync(runtime.wdBaseDir, filepath => {
                if (/\.tpl$/.test(filepath)) {
                    let shortName = utils.shortName(runtime.wdBaseDir, filepath);
                    compress(filepath, shortName);
                }
            }, err => {
                throw new Error(`处理 tpl 文件失败!\n${err.stack}`);
            });
        } catch (e) {
            return reject(e);
        }
        resolve(runtime);
    });
};

module.exports = main;
