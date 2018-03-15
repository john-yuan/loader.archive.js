/**
 * 模板引擎封装模块
 *
 * @author John Yuan
 * @module loader/core/template
 * @version 1.0.0
 */
define(function (require, exports, module) {
    /**
     * 编译模板字符串（ejs）
     *
     * @param {String} templateText ejs 模板字符串
     * @returns {Function}
     */
    var template = function (templateText) {
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            return (function () {
                var ejs = require('loader/deps/ejs');
                return ejs.compile(templateText, {
                    client: true,
                    compileDebug: true,
                    rmWhitespace: true
                });
            })();
        } else {
            return function () {};
        }
    };

    module.exports = template;
});