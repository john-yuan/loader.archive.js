const fs = require('fs');
const path = require('path');
const JSDOM = require('jsdom').JSDOM;
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let htmlText;
        let entry = runtime.config.entry || 'index.html';
        let entryPath = path.resolve(runtime.wd, entry);

        printUtils.info(`解析 ${entry}`);

        try {
            htmlText = fs.readFileSync(entryPath).toString();
        } catch (e) {
            return reject(new Error(`读取入口文件失败!\n${e.message}`));
        }

        let dom;

        try {
            dom = new JSDOM(htmlText);
        } catch (e) {
            return reject(new Error(`创建DOM失败!\n${e.message}`));
        }

        let window = dom.window;
        let document = window.document;
        let configScriptNode = document.querySelector('script[\\@config]');

        if (!configScriptNode) {
            return reject(new Error(`无法读取配置信息, 没有在 ${entry} 中找到 script[@config] 配置节点!`));
        }

        let configScriptCode;

        if (configScriptNode.hasAttribute('src')) {
            let src = configScriptNode.getAttribute('src');
            if (utils.isAbsoluteURL(src)) {
                return reject(new Error(`配置文件地址不能为链接! ${src}`));
            } else if (/^\//.test(src)) {
                return reject(new Error(`配置文件地址不能为绝对路径! ${src}`));
            }
            let entryDir = path.dirname(entryPath);
            let srcPath = path.resolve(entryDir, src);
            if (!utils.isChildPathOf(srcPath, runtime.wd)) {
                return reject(new Error(
                    `配置文件地址必须位于输入目录中! ${src}\n` +
                    `${srcPath} 不属于 ${runtime.wd} 目录!`
                ));
            }
            runtime.rjsConfigSrcPath = srcPath;
            try {
                configScriptCode = fs.readFileSync(srcPath).toString();
            } catch (e) {
                reject(new Error(`读取配置文件失败! ${srcPath}\n${e.stack}`));
            }
        } else {
            configScriptCode = configScriptNode.innerHTML;
        }

        let rjsConfig;

        (function () {
            var require = null;
            eval(configScriptCode);
            rjsConfig = require;
        })();

        if (rjsConfig) {
            runtime.wdBaseDir = path.resolve(runtime.wd, rjsConfig.baseUrl || '');
            runtime.outBaseDir = path.resolve(runtime.out, rjsConfig.baseUrl || '');
            runtime.rjsConfig = rjsConfig;
        } else {
            return reject(new Error(`没有在 ${entry} 中的 script[@config] 配置节点中找到配置信息!`));
        }

        resolve(runtime);
    });
};

module.exports = main;
