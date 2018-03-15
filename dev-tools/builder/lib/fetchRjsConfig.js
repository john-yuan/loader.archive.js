/**
 * 提取 require.js 配置信息
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');
const JSDOM = require('jsdom').JSDOM;

let runtime = {};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {
        let entry = runtime.config.entry || 'index.html';
        let entryPath = path.resolve(runtime.tempDir, entry);
        let htmlText = '';

        try {
            htmlText = fs.readFileSync(entryPath).toString();
        } catch(e) {
            printUtils.error(`读取入口文件失败! ${entryPath}`);
            throw e;
        }

        let dom;

        try {
            dom = new JSDOM(htmlText);
        } catch(e) {
            printUtils.error(`创建 DOM 失败! ${entryPath}`);
            throw e;
        }

        let window = dom.window;
        let document = window.document;
        let configScriptNode = document.querySelector('script[\\@config]');

        if (!configScriptNode) {
            printUtils.error(`读取 require.js 配置信息失败! 没有在 ${entry} 中找到 script[@config] 节点!`)
            return new Error();
        }

        let configScript = configScriptNode.innerHTML;
        let rjsConfig = null;

        (function () {
            var require = null;
            eval(configScript);
            rjsConfig = require;
        })();

        if (rjsConfig) {
            runtime.rjsConfig = rjsConfig;
            runtime.srcPath = path.resolve(runtime.tempDir, rjsConfig.baseUrl || '');
            resolve(runtime);
        } else {
            printUtils.error(`读取 require.js 配置信息失败! 没有在 script[@config] 节点找到配置信息! \n ${configScript}`);
            throw new new Error();
        }
    });
};