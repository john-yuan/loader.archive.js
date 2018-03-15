/**
 * 解析路径对应信息，添加 hash 后缀
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const md5 = require('./md5');
const fileSize = require('./fileSize');
const printUtils = require('./printUtils');

let runtime = {};

const resolveDep = function (mod, dep) {
    if (dep.indexOf('./') === 0 || dep.indexOf('../') === 0) {
        let paths = mod.split('/');
        let child = dep.split('/');

        paths.pop();

        while (child.length) {
            name = child.shift();
            if (name === '.') {
                // doing nothing
            } else if (name === '..') {
                paths.pop();
            } else if (name) {
                paths.push(name);
            }
        }
        return paths.join('/');
    } else {
        return dep;
    }
};

const getDirectDeps = function (moduleId, exclueDeps) {
    let deps = [];

    exclueDeps = exclueDeps || [];

    (runtime.deps[moduleId] || []).forEach(function (dep) {
        if (['require', 'exports', 'module'].indexOf(dep) === -1) {
            if (exclueDeps.indexOf(dep) === -1) {
                deps.push(resolveDep(moduleId, dep));
            }
        }
    });

    return deps;
};

const getLoaderDeps = function () {
    let index = 0;
    let exclueDeps = ['runtime/hooks'];
    let loaderDeps = getDirectDeps('loader/loader', exclueDeps);
    let walkDeps = function () {
        if (index < loaderDeps.length) {
            let dep = loaderDeps[index];
            let deps = getDirectDeps(dep, exclueDeps);

            deps.forEach(function (dep) {
                if (loaderDeps.indexOf(dep) === -1) {
                    loaderDeps.push(dep);
                }
            });

            index += 1;

            walkDeps();
        }
    };
    walkDeps();

    loaderDeps.push('loader/deps/text');

    return loaderDeps;
};

const getModuleInUse = function () {
    let exclueMods = getLoaderDeps();
    let modsInUse = ['loader/deps/require'];
    let pushMod = function (mod) {
        if (mod.indexOf('loader/deps/text!') !== 0) {
            if (exclueMods.indexOf(mod) === -1) {
                exclueMods.push(mod);
                modsInUse.push(mod);
            }
        }
    };

    exclueMods.push('require');
    exclueMods.push('exports');
    exclueMods.push('module');

    for (let moduleId in runtime.deps) {
        if (runtime.deps.hasOwnProperty(moduleId)) {
            pushMod(moduleId);
            (runtime.deps[moduleId] || []).forEach(function (dep) {
                pushMod(resolveDep(moduleId, dep));
            });
        }
    }

    return modsInUse;
};

const bundleLoader = function () {
    let loaderDeps = getLoaderDeps();
    let bundleContent = [];

    loaderDeps.push('loader/loader');
    loaderDeps.forEach(function (dep) {
        let filename = path.resolve(runtime.srcPath, dep + '.js');
        let textContent;
        try {
            textContent = fs.readFileSync(filename).toString();
        } catch(e) {
            printUtils.error(`读取文件失败! ${filename}`);
            throw e;
        }
        if (/^\s*?define\s*?\(\s*?function\s*?\(/.test(textContent)) {
            textContent = textContent.replace(/^\s*?define\s*?\(\s*?function\s*?\(/, `define('${dep}',function (`);
        } else if (/^\s*?define\s*?\(\s*?\[/.test(textContent)) {
            textContent = textContent.replace(/^\s*?define\s*?\(\s*?\[/, `define('${dep}',[`);
        } else if (!/^\s*?define\s*?\(/.test(textContent)) {
            console.log(textContent.substr(0, 120));
            printUtils.error('打包 loader 时出现严重错误, 请联系构建工具开发者解决!');
            throw new Error('打包 loader 时出现严重错误, 请联系构建工具开发者解决!');
        }
        bundleContent.push(textContent);
    });

    bundleContent = bundleContent.join('\n');

    try {
        fse.outputFileSync(path.resolve(runtime.srcPath, 'loader/loader.js'), bundleContent);
    } catch(e) {
        printUtils.error(`保存文件失败! loader/loader.js`);
    }
};

const parsePaths = function () {
    getModuleInUse().forEach(function (moduleId) {
        let filename = path.resolve(runtime.srcPath, moduleId + '.js');
        let textContent;

        try {
            textContent = fs.readFileSync(filename).toString();
        } catch(e) {
            printUtils.error(`读取文件失败! ${filename}`);
            throw e;
        }

        let hash = md5(textContent).substr(0, runtime.config.hashize || 7);
        let newId = moduleId + '.' + hash;
        let newFilename = path.resolve(runtime.srcPath, newId + '.js');

        runtime.hash[moduleId] = hash;
        runtime.paths[moduleId] = newId;
        runtime.fileSize.push({
            module: moduleId,
            size: fileSize(filename)
        });

        try {
            fse.outputFileSync(newFilename, textContent);
        } catch(e) {
            printUtils.error(`重命名文件失败! ${newFilename}`);
            throw e;
        }
    });
};

module.exports = function (data) {
    runtime = data;
    runtime.hash = {};
    runtime.paths = {};
    runtime.fileSize = [];
    return new Promise(function (resolve, reject) {
        let hasError = false;
        try {
            bundleLoader();
            parsePaths();
        } catch(e) {
            hasError = true;
            reject(e);
        }
        if (!hasError) {
            resolve(runtime);
        }
    });
};