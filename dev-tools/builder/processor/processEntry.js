const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const utils = require('../../common/utils');
const printUtils = require('../../common/printUtils');
const JSDOM = require('jsdom').JSDOM;

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let entry = runtime.config.entry || 'index.html';
        let entryPath = path.resolve(runtime.wd, entry);
        let shortName = utils.shortName(runtime.wd, entryPath);
        let htmlText;

        printUtils.info(`解析入口文件 ${entry}`);

        try {
            htmlText = fs.readFileSync(entryPath).toString();
        } catch (e) {
            return reject(new Error(`读取入口文件失败! ${shortName}\n${e.stack}`));
        }

        let dom;

        try {
            dom = new JSDOM(htmlText);
        } catch(e) {
            return reject(new Error(`创建 DOM 失败! ${shortName}`));
        }

        let window = dom.window;
        let document = window.document;
        let configScriptNode = document.querySelector('script[\\@config]');

        if (!configScriptNode) {
            return reject(new Error(`无法读取配置信息, 没有在 ${entry} 中找到 script[@config] 配置节点!`));
        }

        let buildPaths = runtime.paths;
        let rjsConfig = runtime.rjsConfig;
        let paths = rjsConfig.paths || {};

        delete runtime.paths;

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
        } catch (e) {
            return reject(new Error(`生成 require.js 配置信息失败!\n${e.stack}`));
        }

        if (runtime.rjsConfigSrcPath) {
            try {
                fse.outputFileSync(runtime.rjsConfigSrcPath, configText);
            } catch (e) {
                return reject(new Error(`保存 require.js 配置信息失败!\n${e.stack}`));
            }
            delete runtime.rjsConfigSrcPath;
        } else {
            configScriptNode.innerHTML = configText;
        }

        configScriptNode.removeAttribute('@config');

        try {
            htmlText = dom.serialize();
        } catch (e) {
            return reject(new Error(`生成 HTML 文件失败! ${entryPath}\n${e.stack}`));
        }

        try {
            fse.outputFileSync(entryPath, htmlText);
        } catch(e) {
            return reject(new Error(`保存文件失败! ${entryPath}\n${e.stack}`));
        }

        resolve(runtime);
    });
};

module.exports = main;
