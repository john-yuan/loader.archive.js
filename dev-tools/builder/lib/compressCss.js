/**
 * 编译 LESS 文件，压缩 CSS 文件，添加浏览器前缀，图片转换为 DataUri
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const less = require("less");
const CleanCSS = require("clean-css");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const printUtils = require('./printUtils');
const fileSize = require('./fileSize');
const imageDataUri = require('./imageDataUri');
const walkDirSync = require('./walkDirSync');

let runtime = {};

const compressCss = function(mixin, filename, name) {
    let cssText;

    printUtils.info(`编译 ${name}`);

    try {
        cssText = fs.readFileSync(filename).toString();
    } catch(e) {
        printUtils.error(`读取文件内容失败! ${name}`);
        throw e;
    }

    // 如果是视图样式则添加命名空间
    if (name.indexOf('views/') === 0) {
        let namespace = `.v-${name.split(/\/+/).slice(1, -1).join("-")}`;
        cssText = `${namespace} { ${cssText} }`;
    }

    // 添加 mixin
    cssText = mixin + '\n' + cssText;

    // 编译 LESS
    less.render(cssText, function(err, res) {
        if (err) {
            printUtils.error(`编译 LESS 失败! ${name}`);
            throw err;
        } else {
            cssText = res.css;
        }
    });

    // 添加 CSS 浏览器前缀
    try {
        let prefixer = postcss([autoprefixer({
            browsers: runtime.config.autoprefixerBrowsers || autoprefixer.defaults
        })]);
        cssText = prefixer.process(cssText).css;
    } catch(e) {
        printUtils.error(`添加 CSS 浏览器前缀失败! ${name}`);
        throw e;
    }

    // 压缩 CSS 文件
    try {
        let cleanCss = new CleanCSS();
        cssText = cleanCss.minify(cssText).styles;
    } catch(e) {
        printUtils.error(`压缩样式表失败! ${name}`);
        throw e;
    }

    let dataUriLimits = runtime.config.dataUriLimits || 0;
    let prodSrcPrefix = runtime.config.prodSrcPrefix || "";

    cssText = cssText.replace(/\:\s*url\((['"])?(.*?)\1\)/ig, function(match, qoute, url, offset, string) {
        if (/(^\/\/|\:\/\/)/.test(url)) {
            // printUtils.warn(`网络图片 ${url}`);
            return match;
        } else if (/^data:/i.test(url)) {
            // printUtils.warn(`DataUri ${url}`);
            return match;
        } else if (/^\//.test(url)) {
            // printUtils.warn(`绝对路径 ${url}`);
            return match;
        } else {
            let fullImagePath = path.resolve(runtime.tempDir, url);
            let imageUrl = fullImagePath.replace(runtime.tempDir, '');

            imageUrl = imageUrl.replace(/\\/g, '/');
            imageUrl = imageUrl.replace(/^\//, '');

            if (fse.pathExistsSync(fullImagePath)) {
                if (fileSize(fullImagePath) > dataUriLimits) {
                    if (prodSrcPrefix) {
                        let prodUrl = `${prodSrcPrefix}/${imageUrl}`;
                        prodUrl = prodUrl.replace(/\/+/, '/');
                        printUtils.childInfo(`补全: ${prodUrl}`);
                        return `:url("${prodUrl}")`;
                    } else {
                        return match;
                    }
                } else {
                    try {
                        let dataUri = imageDataUri(fullImagePath);
                        printUtils.childInfo(`转换 DataUri: ${url}`);
                        return `:url(${dataUri})`;
                    } catch(e) {
                        printUtils.warn(e.message);
                        printUtils.warn(`转换图片失败! ${url}`);
                        // 转换失败时进行补全
                        if (prodSrcPrefix) {
                            let prodUrl = `${prodSrcPrefix}/${imageUrl}`;
                            prodUrl = prodUrl.replace(/\/+/, '/');
                            printUtils.childInfo(`补全: ${prodUrl}`);
                            return `:url("${prodUrl}")`;
                        } else {
                            return match;
                        }
                    }
                }
            } else {
                throw new Error(`图片(${url})不存在! 请检查文件: ${name}`);
                return match;
            }
        }
    });

    try {
        fse.outputFileSync(filename, cssText);
    } catch(e) {
        printUtils.error(`保存样式文件失败! ${name}`);
        throw e;
    }
};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        let srcPath = runtime.srcPath;
        let hasError = false;
        let mixin, mixinPath = 'runtime/mixin.less';

        try {
            mixin = fs.readFileSync(path.resolve(srcPath, mixinPath)).toString();
        } catch(e) {
            hasError = true;
            printUtils.error(`读取 mixin 失败, 请检查文件 ${mixinPath} 是否存在!`);
            throw e;
            return;
        }

        walkDirSync(srcPath, function(filename) {
            if (!hasError && /\.(css|less)$/i.test(filename)) {
                let name = filename.replace(srcPath, '');
                name = name.replace(/\\/g, '/');
                name = name.replace(/^\//g, '');
                try {
                    if (name !== mixinPath) {
                        compressCss(mixin, filename, name);
                    }
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