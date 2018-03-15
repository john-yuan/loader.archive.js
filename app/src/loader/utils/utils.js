/**
 * 内部工具模块
 *
 * @author John Yuan
 * @module loader/utils/utils
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var hooks = require('runtime/hooks');

    /**
     * 获取数据类型
     *
     * @param {Any} it
     * @returns {String}
     */
    var type = function (it) {
        return Object.prototype.toString.call(it).slice(8, -1).toLowerCase();
    };

    /**
     * 打印提示信息
     *
     * @param {String} message 提示信息
     */
    var info = function (message) {
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            if (hooks.getSettings().logLevel >= 3) {
                if (typeof message === 'string') {
                    arguments[0] = '[提示] ' + message;
                }
                // 此处使用 warn 而不是 info 以查看跟踪信息
                console.warn.apply(console, arguments);
            }
        }
    };

    /**
     * 打印警告信息
     *
     * @param {String} message 警告信息
     */
    var warn = function (message) {
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            if (hooks.getSettings().logLevel >= 2) {
                if (typeof message === 'string') {
                    arguments[0] = '[警告] ' + message;
                }
                console.warn.apply(console, arguments);
            }
        }
    };

    /**
     * 打印错误信息
     *
     * @param {String} message 错误信息
     */
    var error = function (message) {
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            if (hooks.getSettings().logLevel >= 1) {
                if (typeof message === 'string') {
                    arguments[0] = '[错误] ' + message;
                }
                console.error.apply(console, arguments);
            }
        }
    };

    exports.type = type;
    exports.info = info;
    exports.warn = warn;
    exports.error = error;
});