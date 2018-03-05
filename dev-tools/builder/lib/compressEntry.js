/**
 * 处理 entry，添加 require.js paths 信息
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');
const JSDOM = require('jsdom').JSDOM;

let runtime = {};

module.exports = function(data) {
    runtime = data;
    return new Promise(function(resolve, reject) {
        let entry = runtime.config.entry || 'index.html';
        let entryPath = path.resolve(runtime.tempDir, entry);
        let htmlText = '';

        printUtils.info(`处理 ${entry}`);

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
            throw new Error();
        }

        let buildPaths = runtime.paths;
        let rjsConfig = runtime.rjsConfig;
        let paths = rjsConfig.paths || {};

        for (let key in paths) {
            if (paths.hasOwnProperty(key)) {
                let val = paths[key];
                if (buildPaths.hasOwnProperty(val)) {
                    paths[key] = buildPaths[val];
                    delete buildPaths[key];
                }
            }
        }

        for (let key in buildPaths) {
            if (buildPaths.hasOwnProperty(key)) {
                paths[key] = buildPaths[key];
            }
        }

        rjsConfig.paths = paths;

        let configText;

        try {
            configText = 'var require=' + JSON.stringify(rjsConfig) + ';';
        } catch(e) {
            printUtils.error('生成 require.js 配置信息失败!');
            throw e;
        }

        configScriptNode.innerHTML = configText;
        configScriptNode.removeAttribute('@config');

        try {
            htmlText = dom.serialize();
        } catch(e) {
            printUtils.error(`生成 HTML 文件失败! ${entryPath}`);
            throw e;
        }

        try {
            fse.outputFileSync(entryPath, htmlText);
        } catch(e) {
            printUtils.error(`保存文件失败! ${entryPath}`);
            throw e;
        }

        resolve(runtime);
    });
};