const uglifyJS = require('uglify-js');

const minifyJs = function (uglifyOptions, code, shortName, eval) {
    let options = JSON.parse(JSON.stringify(uglifyOptions || {}));

    options.compress = options.compress || {};
    options.compress.drop_console = true;
    options.compress.dead_code = true;
    options.compress.drop_debugger = true;
    options.compress.evaluate = eval;
    options.compress.global_defs = options.compress.global_defs || {};
    options.compress.global_defs.DEBUG = false;
    options.mangle = options.mangle || {};
    options.mangle.reserved = options.mangle.reserved || [];
    options.mangle.reserved = options.mangle.reserved.concat([
        'require', 'module', 'exports', 'define', 'requirejs', 'loader'
    ]);

    if (!eval) {
        delete options.compress.global_defs.DEBUG;
    }

    res = uglifyJS.minify(code, options);

    if (res.error) {
        let err = res.error;
        let message = [];

        message.push(`压缩 ${shortName} 失败!`);
        message.push(`行: ${err.line}, 列: ${err.col}, 位置: ${err.pos}`);
        message = message.join('\n');

        throw new Error(`${message}\n${err.stack}`);
    } else {
        return res.code;
    }
};

module.exports = minifyJs;
