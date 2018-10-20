const fs = require('fs');
const path = require('path');
const ejs = require("ejs");
const utils = require('../../common/utils');
const walkDirSync = require('../../common/walkDirSync');
const printUtils = require('../../common/printUtils');
const minifyJs = require('./minifyJs');

const handleTextDeps = function (runtime, filepath, shortName, moduleId, textDeps) {
    let textArray = [];

    textDeps.forEach(depName => {
        let depUrl = depName.substr(depName.indexOf('!') + 1);

        let depPath;
        if (/^(\.|\.\.)\//.test(depUrl)) {
            depPath = path.resolve(path.dirname(filepath), depUrl);
        } else {
            depPath = path.resolve(runtime.wdBaseDir, depUrl);
        }

        let depShortName = utils.shortName(runtime.wdBaseDir, depPath);
        let textDepId = `loader/plugin/text!${depShortName}`;
        let textContent;

        printUtils.subInfo(`导入 ${depShortName}`);
        if (!utils.isChildPathOf(depPath, runtime.wdBaseDir)) {
            throw new Error(
                `文件 ${depPath} 不属于文件夹 ${runtime.wdBaseDir}\n` +
                `请检查 ${shortName} 中的 ${depName}`
            );
        }
        try {
            textContent = fs.readFileSync(depPath).toString();
            textContent = JSON.stringify(textContent);
        } catch (e) {
            throw new Error(
                `读取文件失败! ${depShortName}\n` +
                `请检查 ${shortName} 中的 ${depName}\n` +
                `${e.message}`
            );
        }

        textContent = `define("${textDepId}",[],function(){return ${textContent};});`;

        textArray.push(textContent);
    });

    return textArray.join('\n');
};

const handleEjsDeps = function (runtime, filepath, shortName, moduleId, ejsDeps) {
    let textArray = [];

    ejsDeps.forEach(depName => {
        let depUrl = depName.substr(depName.indexOf('!') + 1);

        let depPath;
        if (/^(\.|\.\.)\//.test(depUrl)) {
            depPath = path.resolve(path.dirname(filepath), depUrl);
        } else {
            depPath = path.resolve(runtime.wdBaseDir, depUrl);
        }

        let depShortName = utils.shortName(runtime.wdBaseDir, depPath);
        let ejsDepId = `loader/plugin/ejs!${depShortName}`;
        let textContent;

        printUtils.subInfo(`预编译 ${depShortName}`);
        if (!utils.isChildPathOf(depPath, runtime.wdBaseDir)) {
            throw new Error(
                `文件 ${depPath} 不属于文件夹 ${runtime.wdBaseDir}\n` +
                `请检查 ${shortName} 中的 ${depName}`
            );
        }
        try {
            textContent = fs.readFileSync(depPath).toString();
        } catch (e) {
            throw new Error(
                `读取文件失败! ${depShortName}\n` +
                `请检查 ${shortName} 中的 ${depName}\n` +
                `${e.message}`
            );
        }

        try {
            textContent = ejs.compile(textContent, {
                client: true,
                compileDebug: false,
                // 以下配置项与 loader/plugin/ejs 对应
                _with: false,
                localsName: 'data',
                rmWhitespace: true
            }).toString();
            textContent = minifyJs(runtime.config.uglifyOptions, textContent, depShortName, true);
            textContent = textContent.replace(/^function anonymous\(/, 'function(');
        } catch (e) {
            throw new Error(`预编译 less 失败! ${depShortName} in ${shortName} \n${e.stack}`);
        }

        textContent = `define("${ejsDepId}",[],function(){return ${textContent};});`;

        textArray.push(textContent);
    });

    return textArray.join('\n');
};

const handleDeps = function (runtime, filepath, shortName, moduleId, codeTextContent) {
    let deps = ["require", "exports", "module"];
    let textDeps = [];
    let ejsDeps = [];
    let cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;

    codeTextContent.replace(cjsRequireRegExp, (match, dep) => {
        if (dep.indexOf('loader/plugin/text!') === 0) {
            textDeps.push(dep);
        } else if (dep.indexOf('loader/plugin/ejs!') === 0) {
            ejsDeps.push(dep);
        }
        deps.push(dep);
    });

    codeTextContent = codeTextContent.replace(
        /^\s*?define\s*?\(\s*?function\s*?\(\s*?require\s*?\,\s*?exports\s*?\,\s*?module\s*?\)\s*?\{/,
        `define("${moduleId}",${JSON.stringify(deps)},function(require,exports,module){`
    );

    let textArray = [];
    let textDepsContent = handleTextDeps(runtime, filepath, shortName, moduleId, textDeps);
    let ejsDepsContent = handleEjsDeps(runtime, filepath, shortName, moduleId, ejsDeps);

    textDepsContent && textArray.push(textDepsContent);
    ejsDepsContent && textArray.push(ejsDepsContent);

    textArray.push(codeTextContent);

    runtime.depsInfo[moduleId] = deps;

    return textArray.join('\n');
};

const compress = function (runtime, filepath, shortName) {
    let codeTextContent;
    let moduleId = shortName.replace(/\.js$/, '');

    printUtils.subInfo(`压缩 ${shortName}`);

    try {
        codeTextContent = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取文件失败!\n${e.stack}`);
    }

    codeTextContent = minifyJs(runtime.config.uglifyOptions, codeTextContent, shortName, true);

    let regAMD = /^\s*?define\s*?\(\s*?function\s*?\(\s*?require\s*?\,\s*?exports\s*?\,\s*?module\s*?\)\s*?\{/;

    if (regAMD.test(codeTextContent)) {
        amd = true;
        codeTextContent = handleDeps(runtime, filepath, shortName, moduleId, codeTextContent);
    } else if (codeTextContent.indexOf('define([') === 0) {
        codeTextContent = codeTextContent.replace('define([', `define("${moduleId}",[`);
        amd = true;
    } else if (codeTextContent.indexOf('define(function(') === 0) {
        codeTextContent = codeTextContent.replace('define(function(', `define("${moduleId}",["module"],function(`);
        amd = true;
    } else {
        amd = false;
    }

    runtime.moduleInfo[moduleId] = {
        amd: amd,
        size: codeTextContent.length
    };

    try {
        fs.writeFileSync(filepath, codeTextContent);
    } catch(e) {
        throw new Error(`保存文件失败!\n${e.stack}`);
    }
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        runtime.moduleInfo = {};
        runtime.depsInfo = {};
        try {
            printUtils.info(`处理 js 文件`);
            walkDirSync(runtime.wdBaseDir, filepath => {
                if (/\.js$/.test(filepath)) {
                    let shortName = utils.shortName(runtime.wdBaseDir, filepath);
                    compress(runtime, filepath, shortName);
                }
            }, err => {
                throw new Error(`处理 js 文件失败!\n${err.stack}`);
            });
        } catch (e) {
            return reject(e);
        }
        resolve(runtime);
    });
};

module.exports = main;
