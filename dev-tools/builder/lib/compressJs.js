/**
 * 压缩 JS 文件，编译 EJS 模板，打包 loader/deps/text! 依赖
 */

const fs = require('fs');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const printUtils = require('./printUtils');
const walkDirSync = require('./walkDirSync');
const uglifyJS = require("uglify-js");

let runtime = {};

const uglify = function (code) {
    let options = JSON.parse(JSON.stringify(runtime.config.uglifyOptions || {}));

    options.compress = options.compress || {};
    options.compress.drop_console = true;
    options.compress.dead_code = true;
    options.compress.drop_debugger = true;
    options.compress.evaluate = true;
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

const compressEjs = function (textContent, filename, name, srcPath) {
    let regexp = /\bloader\.template\s*\(\s*require\s*\(\s*(\'|\")(.*?)\1\s*\)\s*\)/g;

    textContent = textContent.replace(regexp, function (match, quote, ejsDep, offset, string) {
        let ejsPath = ejsDep.substr('loader/deps/text!'.length);

        printUtils.childInfo(`编译: ${ejsDep}`);

        if (ejsPath.indexOf('./') === 0 || ejsPath.indexOf('../') === 0) {
            ejsPath = path.resolve(path.dirname(filename), ejsPath);
        } else {
            ejsPath = path.resolve(srcPath, ejsPath);
        }

        let ejsText;
        try {
            ejsText = fs.readFileSync(ejsPath).toString();
        } catch(e) {
            printUtils.error(`读取文件失败! ${ejsPath}`);
            throw e;
        }


        try {
            let funcString = ejs.compile(ejsText, {
                client: true,
                compileDebug: false,
                rmWhitespace: true
            }).toString();

            funcString = uglify(funcString).replace(/^function\s+[^\(]+/, 'function');

            if (!funcString) {
                printUtils.error('编译模板时出现严重错误, 请联系构建工具开发者解决!');
                throw new Error('编译模板时出现严重错误, 请联系构建工具开发者解决!');
            }

            funcString = '(' + funcString + ')';

            return funcString;
        } catch(e) {
            console.log(ejsText);
            printUtils.error(`编译 EJS 模板失败! ${ejsPath}`);
            throw e;
        }
    });

    return textContent;
};

const handleTextDeps = function (code, filepath, name, srcPath) {
    let deps = ['require', 'exports', 'module'];
    let moduleId = name.replace(/\.js/i, '');
    let cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
    let text = '', textDeps = [];

    code.replace(cjsRequireRegExp, function (match, dep) {
        if (dep.indexOf('loader/deps/text!') === 0) {
            textDeps.push(dep);
        }
        deps.push(dep);
    });

    textDeps.forEach(function (dep) {
        let depText, depId, depPath, pos, prefix, depUrl;

        printUtils.childInfo(`合并: ${dep}`);

        pos = dep.indexOf('!') + 1;
        prefix = dep.substr(0, pos);
        depUrl = dep.substr(pos);

        if (depUrl.indexOf('./') === 0 || depUrl.indexOf('../') === 0) {
            depPath = path.resolve(path.dirname(filepath), depUrl);
            depId = prefix + moduleId.split('/').slice(0, -1).join('/') + depUrl.replace('./', '/');
        } else {
            depPath = path.resolve(srcPath, depUrl);
            depId = dep;
        }

        try {
            depText = JSON.stringify(fs.readFileSync(depPath).toString());
        } catch(e) {
            throw new Error(`读取文件失败 ${depUrl}\n    ${e.stack}`);
        }


        text += `define('${depId}',[],function (){return ${depText}});\n`;
    });

    code = code.replace(
        /^\s*?define\s*?\(\s*?function\s*?\(\s*?require\s*?\,\s*?exports\s*?\,\s*?module\s*?\)\s*?\{/,
        `define('${moduleId}',${JSON.stringify(deps)},function (require,exports,module){`
    );

    code = text + code;

    runtime.deps[moduleId] = deps;

    return code;
};

const compressJs = function (filename, name, srcPath) {
    let textContent;

    printUtils.info(`压缩 ${name}`);

    try {
        textContent = fs.readFileSync(filename).toString();
    } catch(e) {
        printUtils.error(`读取文件失败! ${name}`);
        throw e;
    }

    try {
        textContent = uglify(textContent);
    } catch(e) {
        printUtils.error(`压缩代码失败! ${name}`);
        throw e;
    }

    let regAMD = /^\s*?define\s*?\(\s*?function\s*?\(\s*?require\s*?\,\s*?exports\s*?\,\s*?module\s*?\)\s*?\{/;

    if (regAMD.test(textContent)) {
        textContent = compressEjs(textContent, filename, name, srcPath);
        textContent = handleTextDeps(textContent, filename, name, srcPath);
    }

    try {
        fse.outputFileSync(filename, textContent);
    } catch(e) {
        printUtils.error(`保存文件失败! ${name}`);
        throw e;
    }
};

module.exports = function (data) {
    runtime = data;
    runtime.deps = {};
    return new Promise(function (resolve, reject) {
        let srcPath = runtime.srcPath;
        let hasError = false;
        walkDirSync(srcPath, function (filename) {
            if (!hasError && /\.js$/i.test(filename)) {
                let name = filename.replace(srcPath, '');
                name = name.replace(/\\/g, '/');
                name = name.replace(/^\//g, '');
                try {
                    compressJs(filename, name, srcPath);
                } catch(e) {
                    hasError = true;
                    reject(e);
                }
            }
        }, function (err) {
            hasError = true;
            printUtils.error(`遍历文件夹失败! ${srcPath}`);
            reject(err);
        });
        if (!hasError) {
            resolve(runtime);
        }
    });
};