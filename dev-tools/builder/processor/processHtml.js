const fs = require('fs');
const path = require('path');
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');
const fileSize = require('../../common/fileSize');
const saveHashFile = require('../../common/saveHashFile');
const JSDOM = require('jsdom').JSDOM;
const minifyCss = require('./minifyCss');
const minifyJs = require('./minifyJs');
const minify = require('html-minifier').minify;

const querySelectorAll = function (document, selector) {
    let result = document.querySelectorAll(selector);
    if (result) {
        result = [].slice.call(result, 0);
    } else {
        result = [];
    }
    return result;
};

const processRemove = function (runtime, window, document, filepath, shortName) {
    let styleNodes = querySelectorAll(document, 'style[\\@remove]')
    let scriptNodes = querySelectorAll(document, 'script[\\@remove]');

    styleNodes.forEach(node => node.parentNode.removeChild(node));
    scriptNodes.forEach(node => node.parentNode.removeChild(node));
};

const processSerialNo = function (runtime, window, document, filepath, shortName) {
    let html = document.querySelector('html[\\@serialNo]');

    if (html) {
        html.removeAttribute('@serialNo');
        html.setAttribute('data-serial-no', runtime.serialNo);
        printUtils.subInfo(`注入构建序列 ${shortName}`);
    }
};

const getNewUrlWithHash = function (url, hash) {
    let paths = url.replace(/\/+/, '/').split('/');
    let name = paths.pop().split('.');
    let ext = name.pop();
    name = name.join('.') + '-' + hash + '.' + ext;
    paths.push(name);
    return paths.join('/');
};

const processStyle = function (runtime, window, document, filepath, shortName) {
    let linkNodes = querySelectorAll(document, 'link');

    linkNodes.forEach(node => {
        let href;

        if (node.hasAttribute('rel')) {
            if (node.getAttribute('rel').toLowerCase() === 'stylesheet') {
                href = node.getAttribute('href');
            }
        }

        if (href) {
            let dir = path.dirname(filepath);
            let stylePath = path.resolve(dir, href);

            if (!utils.isChildPathOf(stylePath, runtime.wd)) {
                throw new Error(
                    `${href} 不在项目目录中, 请检查: ${shortName}\n` +
                    `文件地址: ${stylePath}\n` +
                    `项目目录: ${runtime.wd}`
                );
            }

            let textContent;
            try {
                textContent = fs.readFileSync(stylePath).toString();
            } catch (e) {
                throw new Error(`读取文件失败! ${href} in ${shortName} \n${e.stack}`);
            }

            let imageDataUriSize = node.getAttribute('@imageDataUriSize');
            node.removeAttribute('@imageDataUriSize');
            if (imageDataUriSize) {
                imageDataUriSize = parseFloat(imageDataUriSize);
            } else {
                imageDataUriSize = 0;
            }
            textContent = minifyCss(runtime.wd, path.dirname(stylePath), href, textContent, {
                compressLess: false,
                autoprefixerBrowsers: runtime.config.autoprefixerBrowsers,
                prodSrcPrefix: runtime.config.prodSrcPrefix,
                imageDataUriSize: imageDataUriSize || runtime.config.imageDataUriSize
            });

            try {
                fs.writeFileSync(stylePath, textContent);
            } catch (e) {
                throw new Error(`保存文件失败! ${href} in ${shortName} \n${e.stack}`);
            }

            let res = saveHashFile(stylePath, runtime.config.hashSize || 7);
            let hash = res.hash;

            if (runtime.processHtmlTemp.indexOf(stylePath) === -1) {
                runtime.processHtmlTemp.push(stylePath);
                runtime.sizeInfo.push({
                    name: utils.shortName(runtime.wd, stylePath),
                    hash: hash,
                    path: utils.shortName(runtime.wd, res.path),
                    size: fileSize(stylePath)
                });
            }

            node.setAttribute('href', getNewUrlWithHash(href, hash));
        }
    });

    let styleNodes = querySelectorAll(document, 'style');

    styleNodes.forEach(node => {
        if (!node.hasAttribute('type') || node.getAttribute('type').toLowerCase() === 'text/css') {
            let cssText = node.innerHTML;
            let imageDataUriSize = node.getAttribute('@imageDataUriSize');
            node.removeAttribute('@imageDataUriSize');
            if (imageDataUriSize) {
                imageDataUriSize = parseFloat(imageDataUriSize);
            } else {
                imageDataUriSize = 0;
            }
            cssText = minifyCss(runtime.wd, path.dirname(filepath), shortName, cssText, {
                compressLess: false,
                autoprefixerBrowsers: runtime.config.autoprefixerBrowsers,
                prodSrcPrefix: runtime.config.prodSrcPrefix,
                imageDataUriSize: imageDataUriSize || runtime.config.imageDataUriSize
            });
            node.innerHTML = cssText;
        }
    });
};

const processScript = function (runtime, window, document, filepath, shortName) {
    let scriptNodes = querySelectorAll(document, 'script');

    scriptNodes.forEach(node => {
        if (!node.hasAttribute('type') || node.getAttribute('type').toLocaleLowerCase() === 'text/javascript') {
            let noeval = node.hasAttribute('@noeval');
            node.removeAttribute('@noeval');
            if (node.hasAttribute('src')) {
                let src = node.getAttribute('src');
                let dir = path.dirname(filepath);
                let scriptPath = path.resolve(dir, src);

                if (!utils.isChildPathOf(scriptPath, runtime.wd)) {
                    throw new Error(
                        `${src} 不在项目目录中, 请检查: ${shortName}\n` +
                        `文件地址: ${scriptPath}\n` +
                        `项目目录: ${runtime.wd}`
                    );
                }

                let textContent;
                try {
                    textContent = fs.readFileSync(scriptPath).toString();
                } catch (e) {
                    throw new Error(`读取文件失败! ${src} in ${shortName} \n${e.stack}`);
                }

                textContent = minifyJs(runtime.config.uglifyOptions, textContent, src, !noeval);

                try {
                    fs.writeFileSync(scriptPath, textContent);
                } catch (e) {
                    throw new Error(`保存文件失败! ${src} in ${shortName} \n${e.stack}`);
                }

                let res = saveHashFile(scriptPath, runtime.config.hashSize || 7);
                let hash = res.hash;

                if (runtime.processHtmlTemp.indexOf(scriptPath) === -1) {
                    runtime.processHtmlTemp.push(scriptPath);
                    runtime.sizeInfo.push({
                        name: utils.shortName(runtime.wd, scriptPath),
                        hash: hash,
                        path: utils.shortName(runtime.wd, res.path),
                        size: fileSize(scriptPath)
                    });
                }

                node.setAttribute('src', getNewUrlWithHash(src, hash));
            } else {
                let textContent = node.innerHTML;
                textContent = minifyJs(runtime.config.uglifyOptions, textContent, shortName, !noeval);
                node.innerHTML = textContent;
            }
        }
    });
};

const processHtml = function (runtime, filepath) {
    let shortName = utils.shortName(runtime.wd, filepath);

    printUtils.info(`处理 ${shortName}`);

    let textContent;

    try {
        textContent = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取文件失败! ${filepath}\n${e.stack}`);
    }

    let dom;

    try {
        dom = new JSDOM(textContent);
    } catch(e) {
        throw new Error(`创建 DOM 失败! ${shortName}`);
    }

    let window = dom.window;
    let document = window.document;

    processRemove(runtime, window, document, filepath, shortName);
    processSerialNo(runtime, window, document, filepath, shortName);
    processStyle(runtime, window, document, filepath, shortName);
    processScript(runtime, window, document, filepath, shortName);

    // 是否使用内联 <script> 标签注入关闭调试模式的 DEBUG=false 变量
    if (runtime.config.injectDebugOffWithInlineScript) {
        let script = document.createElement('script');
        script.innerHTML = 'var DEBUG=false;';

        let firstScriptNode = document.querySelector('script');

        if (firstScriptNode) {
            firstScriptNode.parentNode.insertBefore(script, firstScriptNode);
        } else {
            try {
                (document.head || document.body).appendChild(script);
            } catch (e) {
                printUtils.warn(`没有找到 <head> 或 <body> 请检查 ${shortName}`);
            }
        }
    }

    textContent = dom.serialize();
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
        throw new Error(`保存文件失败! ${filepath}\n${e.stack}`);
    }

    runtime.sizeInfo.push({
        name: shortName,
        size: fileSize(filepath)
    });
};

const start = function (runtime) {
    let htmlFiles = [];
    let pushHtmlFile = function (filepath) {
        if (htmlFiles.indexOf(filepath) === -1) {
            if (utils.isChildPathOf(filepath, runtime.wd)) {
                htmlFiles.push(filepath);
            } else {
                throw new Error(`${filepath} 不属于 ${runtime.wd} 目录!`);
            }
        }
    };

    let entry = runtime.config.entry || 'index.html';
    pushHtmlFile(path.resolve(runtime.wd, entry));

    let dir;

    try {
        dir = fs.readdirSync(runtime.wd);
    } catch (e) {
        throw new Error(`读取文件夹失败!\n${e.stack}`);
    }

    dir.forEach(filename => {
        let filepath = path.resolve(runtime.wd, filename);
        if (/\.html$/i.test(filepath)) {
            try {
                let stat = fs.statSync(filepath);
                if (stat.isFile()) {
                    pushHtmlFile(filepath);
                }
            } catch (e) {
                throw new Error(`获取文件状态失败! ${filename}\n${e.stack}`);
            }
        }
    });

    if (runtime.config.htmlFiles) {
        runtime.config.htmlFiles.forEach(filename => {
            pushHtmlFile(path.resolve(runtime.wd, filename));
        });
    }

    while (htmlFiles.length) {
        processHtml(runtime, htmlFiles.shift());
    }
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        runtime.processHtmlTemp = [];
        try {
            start(runtime);
        } catch (e) {
            return reject(e);
        }
        delete runtime.processHtmlTemp;
        resolve(runtime);
    });
};

module.exports = main;
