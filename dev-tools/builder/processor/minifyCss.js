const CleanCSS = require('clean-css');
const postcss = require('postcss');
const path = require('path');
const fse = require('fs-extra');
const autoprefixer = require('autoprefixer');
const less = require('less');
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');
const fileSize = require('../../common/fileSize');
const imageDataUri = require('../../common/imageDataUri');

/**
 * 压缩 CSS
 *
 * @param {string} rootDir
 * @param {string} baseDir
 * @param {string} shortName
 * @param {string} cssText
 * @param {object} options
 * @param {boolean} options.compressLess
 * @param {Array} options.autoprefixerBrowsers
 * @param {string} options.prodSrcPrefix
 * @param {number} options.imageDataUriSize
 */
const minifyCss = function (rootDir, baseDir, shortName, cssText, options) {
    options = options || {};
    // 处理 Less
    if (options.compressLess) {
        less.render(cssText, {
            paths: [ rootDir ],
            filename: shortName
        }, function (err, res) {
            if (err) {
                throw new Error(`编译 Less 文件失败! ${shortName}\n${err.stack}`);
            } else {
                cssText = res.css;
            }
        });
    }
    // 添加 CSS 浏览器前缀
    try {
        let prefixer = postcss([autoprefixer({
            browsers: options.autoprefixerBrowsers || autoprefixer.defaults
        })]);
        cssText = prefixer.process(cssText).css;
    } catch (e) {
        throw new Error(`添加 CSS 浏览器前缀失败! ${shortName}\n${e.stack}`);
    }

    // 压缩 CSS 文件
    try {
        let cleanCss = new CleanCSS();
        cssText = cleanCss.minify(cssText).styles;
    } catch (e) {
        throw new Error(`压缩 CSS 失败! ${shortName}\n${e.stack}`);
    }

    let prodSrcPrefix = options.prodSrcPrefix || '';
    let imageDataUriSize = options.imageDataUriSize || 0;

    prodSrcPrefix = prodSrcPrefix.trim();

    if (prodSrcPrefix) {
        if (!/\/$/.test(prodSrcPrefix)) {
            prodSrcPrefix += '/';
        }
    }

    cssText = cssText.replace(/\:\s*url\((['"])?(.*?)\1\)/ig, function (match, qoute, url, offset, string) {
        if (utils.isAbsoluteURL(url)) {
            printUtils.warn(`在样式表中使用绝对链接 ${url} in ${shortName}`);
            return match;
        } else if (/^data:/i.test(url)) {
            return match;
        } else if (/^\//.test(url)) {
            printUtils.warn(`在样式表中使用绝对路径 ${url} in ${shortName}`);
            return match;
        } else {
            let filepath = path.resolve(baseDir, url);
            if (!utils.isChildPathOf(filepath, rootDir)) {
                throw new Error(
                    `图片 ${url} 路径不属于 ${rootDir}, 请检查文件: ${shortName}`
                );
            }
            if (!fse.pathExistsSync(filepath)) {
                throw new Error(`图片 ${url} 不存在! 请检查文件: ${shortName}`);
            }
            if (fileSize(filepath) > imageDataUriSize) {
                if (prodSrcPrefix) {
                    let prodUrl = `${prodSrcPrefix}${url}`;
                    printUtils.subInfo(`补全: ${prodUrl}`);
                    return `:url("${prodUrl}")`;
                } else {
                    return match;
                }
            } else {
                try {
                    let dataUri = imageDataUri(filepath);
                    printUtils.childInfo(`图片转 DataUri: ${url}`);
                    return `:url(${dataUri})`;
                } catch (e) {
                    printUtils.warn(`图片转 DataUri 失败! ${url}\n${e.stack}`);
                    // 转换失败时进行补全
                    if (prodSrcPrefix) {
                        let prodUrl = `${prodSrcPrefix}${url}`;
                        printUtils.subInfo(`补全: ${prodUrl}`);
                        return `:url("${prodUrl}")`;
                    } else {
                        return match;
                    }
                }
            }
        }
    });

    return cssText;
};

module.exports = minifyCss;
