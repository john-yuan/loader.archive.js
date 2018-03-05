/**
 * 压缩 .tpl 文件
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');
const walkDirSync = require('./walkDirSync');
const minify = require('html-minifier').minify;

let runtime = {};

const compressTpl = function(filename, name) {
    let tplContent;

    try {
        tplContent = fs.readFileSync(filename).toString().trim();
    } catch(e) {
        printUtils.error(`读取文件内容失败! ${name}`);
        throw e;
    }

    try {
        tplContent = minify(tplContent, {
            removeComments: true,
            collapseWhitespace: true
        });
    } catch(e) {
        printUtils.error(`压缩模板文件失败! ${name}`);
        throw e;
    }

    try {
        fse.outputFileSync(filename, tplContent);
    } catch(e) {
        printUtils.error(`保存模板文件失败! ${name}`);
        throw e;
    }

    printUtils.info(`压缩 ${name}`);
};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        let srcPath = runtime.srcPath;
        let hasError = false;
        walkDirSync(srcPath, function(filename) {
            if (!hasError && /\.tpl$/i.test(filename)) {
                let name = filename.replace(srcPath, '');
                name = name.replace(/\\/g, '/');
                name = name.replace(/^\//g, '');
                try {
                    compressTpl(filename, name);
                } catch(e) {
                    hasError = true;
                    reject(e);
                }
            }
        }, function(err) {
            hasError = true;
            printUtils.error(`遍历文件夹失败! ${srcPath}`);
            reject(err);
        });
        if (!hasError) {
            resolve(runtime);
        }
    });
};