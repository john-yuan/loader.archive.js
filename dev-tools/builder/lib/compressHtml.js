/**
 * 处理根目录下的 html 文件，和 entry
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const minify = require('html-minifier').minify;
const printUtils = require('./printUtils');
const uglifyJS = require("uglify-js");
const JSDOM = require('jsdom').JSDOM;
const autoprefixer = require("autoprefixer");
const CleanCSS = require("clean-css");
const postcss = require("postcss");
const md5 = require('./md5');

let runtime = {};
let dom, window, document;

const isAbsoluteURL = function (url) {
    return /^(?:[a-z][a-z0-9\-\.\+]*:)?\/\//i.test(url);
};

const uglify = function (code) {
    let options = JSON.parse(JSON.stringify(runtime.config.uglifyOptions || {}));

    options.compress = options.compress || {};
    options.compress.drop_console = true;
    options.compress.dead_code = true;
    options.compress.drop_debugger = true;
    options.compress.evaluate = false;
    options.compress.global_defs = options.compress.global_defs || {};
    options.compress.global_defs.DEBUG = false;
    options.mangle = options.mangle || {};
    options.mangle.reserved = options.mangle.reserved || [];
    options.mangle.reserved = options.mangle.reserved.concat([
        'require', 'module', 'exports', 'define', 'requirejs', 'loader'
    ]);

    res = uglifyJS.minify(code, options);

    if (res.error) {
        throw res.error;
    } else {
        return res.code;
    }
};

const compressHtml = function (filepath, filename) {
    let htmlText;

    printUtils.info(`压缩 ${filename}`);

    try {
        htmlText = fs.readFileSync(filepath).toString();
    } catch(e) {
        printUtils.error(`读取文件失败! ${filepath}`);
        throw e;
    }

    try {
        htmlText = minify(htmlText, {
            removeComments: true,
            collapseWhitespace: true
        });
    } catch(e) {
        printUtils.error(`压缩 HTML 文件失败! ${filepath}`);
        throw e;
    }

    try {
        dom = new JSDOM(htmlText);
    } catch(e) {
        printUtils.error(`创建 DOM 失败! ${filepath}`);
        throw e;
    }

    window = dom.window;
    document = window.document;

    let scriptToRemove = document.querySelectorAll('script[\\@remove]');

    if (scriptToRemove) {
        [].slice.call(scriptToRemove).forEach((node) => {
            node.parentNode.removeChild(node);
        });
    }

    addGlobalDefs(filepath, filename);
    compressScript(filepath, filename);
    compressStyle(filepath, filename);

    try {
        htmlText = dom.serialize();
    } catch(e) {
        printUtils.error(`生成 HTML 失败! ${filepath}`);
        throw e;
    }

    try {
        fse.outputFileSync(filepath, htmlText);
    } catch(e) {
        printUtils.error(`保存文件失败! ${filepath}`);
        throw e;
    }
};

const addGlobalDefs = function (filepath, filename) {
    let options = JSON.parse(JSON.stringify(runtime.config.uglifyOptions || {}));

    options.compress = options.compress || {};
    options.compress.global_defs = options.compress.global_defs || {};
    options.compress.global_defs.DEBUG = false;

    let defs = [];
    let globalDefs = options.compress.global_defs;
    let injectBuildId = runtime.config.injectBuildId;

    if (injectBuildId) {
        if (globalDefs.hasOwnProperty(injectBuildId)) {
            printUtils.error(`注入构建编号失败, 全局变量 ${injectBuildId} 已经存在!`);
            throw new Error();
        } else {
            globalDefs[injectBuildId] = runtime.buildUUID;
        }
    }

    for (let prop in globalDefs) {
        if (globalDefs.hasOwnProperty(prop)) {
            try {
                defs.push(prop + '=' + JSON.stringify(globalDefs[prop]));
            } catch(e) {
                printUtils.error(`添加全局变量 ${prop} = ${globalDefs[prop]} 失败!`);
                throw e;
            }
        };
    }


    let code = 'var ' + defs.join(',') + ';';
    let firstScript = document.querySelector('script');

    if (firstScript) {
        if (firstScript.hasAttribute('src')) {
            let src = firstScript.getAttribute('src');
            let dir = path.dirname(filepath);
            let srcPath = path.resolve(dir, src);
            let currentCode;

            try {
                currentCode = fs.readFileSync(srcPath).toString();
            } catch(e) {
                printUtils.error(`读取文件失败失败! ${srcPath}`);
                throw e;
            }
            currentCode = code + '\n' + currentCode;
            try {
                fse.outputFileSync(srcPath, currentCode);
            } catch (e) {
                printUtils.error(`保存文件失败失败! ${srcPath}`);
                throw e;
            }
        } else {
            let currentCode = firstScript.innerHTML;
            currentCode = code + '\n' + currentCode;
            firstScript.innerHTML = currentCode;
        }
    } else {
        let script = document.createElement('script');
        if (runtime.config.globalDefsDir) {
            let globalDefsDir = runtime.config.globalDefsDir;

            globalDefsDir = globalDefsDir.replace(/\\+/g, '/');
            globalDefsDir = globalDefsDir.replace(/\/+/g, '/');
            globalDefsDir = globalDefsDir.replace(/^\//, '');
            globalDefsDir = globalDefsDir.replace(/\/$/, '');

            let dir = path.resolve(path.dirname(filepath), runtime.config.globalDefsDir);

            if (fse.pathExistsSync(dir)) {
                try {
                    stat = fs.statSync(dir);
                } catch (e) {
                    printUtils.error(`读取文件信息失败! ${dir}`);
                    throw e;
                }
                if (!stat.isDirectory()) {
                    printUtils.error(`此路径不是一个文件夹! ${dir}`);
                    throw new Error();
                }
            }

            let getFilename = function () {
                var filename, count = 0;

                do {
                    count += 1;
                    filename = path.resolve(dir, 'global.' + count + '.js');
                } while (fse.pathExistsSync(filename));

                return count;
            };

            let globalFilename = 'global.' + getFilename() + '.js';
            let globalSrc = './' + globalDefsDir + '/' + globalFilename;
            let globalFilepath = path.resolve(dir, globalFilename);

            try {
                fse.outputFileSync(globalFilepath, code);
            } catch (e) {
                printUtils.error(`保存文件失败! ${globalFilepath}`);
                throw e;
            }

            script.setAttribute('src', globalSrc);
        } else {
            script.innerHTML = code;
        }
        document.head.appendChild(script);
    }
};

const compressScript = function (filepath, filename) {
    let scripts = [].slice.call(document.getElementsByTagName('script') || []);

    scripts.forEach(function (script) {
        if (script.hasAttribute('@remove')) {
            script.parentNode.removeChild(script);
        } else if (script.hasAttribute('src')) {
            let src = script.getAttribute('src');
            if (!isAbsoluteURL(src)) {
                let dir = path.dirname(filepath);
                let srcPath = path.resolve(dir, src);
                let code;

                try {
                    code = fs.readFileSync(srcPath).toString();
                } catch(e) {
                    printUtils.error(`读取文件失败! ${srcPath}`);
                    throw e;
                }

                try {
                    code = uglify(code);
                } catch(e) {
                    printUtils.error(`压缩文件失败! ${srcPath}`);
                    throw e;
                }

                let hash = md5(code).substr(0, 7);
                src = src.replace(/(\.js)$/, '.' + hash + '$1');
                srcPath = srcPath.replace(/(\.js)$/, '.' + hash + '$1');

                try {
                    fse.outputFileSync(srcPath, code);
                } catch (e) {
                    printUtils.error(`保存文件失败! ${srcPath}`);
                    throw e;
                }

                try {
                    fs.utimesSync(srcPath, 60, 60);
                } catch (e) {
                    printUtils.error(`修改文件最后修改时间失败! ${srcPath}`);
                    throw e;
                }

                script.setAttribute('src', src);
            }
        } else {
            let code;
            try {
                code = (script.innerHTML || '').trim();
                if (code) {
                    code = uglify(code);
                }
            } catch(e) {
                printUtils.error(`压缩代码失败!\n${script.innerHTML}`);
                throw e;
            }
            script.innerHTML = code;
        }
    });
};

const compressStyle = function (filepath, filename) {
    let styles = [].slice.call(document.getElementsByTagName('style') || []);

    styles.forEach(function (style) {
        if (style.hasAttribute('@remove')) {
            style.parentNode.removeChild(style);
        } else {
            let code = (style.innerHTML || '').trim();
            if (code) {
                try {
                    let prefixer = postcss([autoprefixer({
                        browsers: runtime.config.autoprefixerBrowsers || autoprefixer.defaults
                    })]);
                    code = prefixer.process(code).css;
                } catch(e) {
                    printUtils.error(`添加 CSS 浏览器前缀失败!\n${code}`);
                    throw e;
                }
                try {
                    let cleanCss = new CleanCSS();
                    code = cleanCss.minify(code).styles;
                } catch(e) {
                    printUtils.error(`压缩 CSS 失败!\n${code}`);
                    throw e;
                }
                style.innerHTML = code;
            }
        }
    });
};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {
        let succeed = true;
        let dir = [];
        try {
            dir = fs.readdirSync(runtime.tempDir);
        } catch(e) {
            succeed = false;
            printUtils.error(`读取目录失败! ${runtime.tempDir}`);
            reject(e);
        }
        if (succeed) {
            let htmlFileList = [];
            let htmlFileInfo = [];

            dir.forEach(function (filename) {
                let stat, filepath = path.resolve(runtime.tempDir, filename);

                if (succeed && /\.html?$/i.test(filename)) {
                    try {
                        stat = fs.statSync(filepath);
                    } catch(e) {
                        succeed = false;
                        printUtils.error(`读取文件信息失败! ${filepath}`);
                        reject(e);
                        return false;
                    }
                    if (stat.isFile()) {
                        htmlFileList.push(filepath);
                        htmlFileInfo.push({
                            filename: filename,
                            filepath: filepath
                        });
                    }
                }
            });

            let entry = runtime.config.entry || 'index.html';
            let entryPath = path.resolve(runtime.tempDir, entry);

            if (htmlFileList.indexOf(entryPath) === -1) {
                htmlFileInfo.push({
                    filename: entry,
                    filepath: entryPath
                });
            }

            htmlFileInfo.forEach(function (info) {
                try {
                    compressHtml(info.filepath, info.filename);
                } catch(e) {
                    succeed = false;
                    reject(e);
                    return false;
                }
            });
        }
        if (succeed) {
            resolve(runtime);
        }
    });
};