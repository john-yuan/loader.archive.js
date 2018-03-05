const colors = require('colors');

/**
 * 打印提示信息
 *
 * @param {String} message
 */
const info = function(message) {
    console.info(colors.green('[提示] ' + message));
};

/**
 * 打印次级提示信息
 *
 * @param {String} message
 */
const childInfo = function(message) {
    console.info(colors.gray('[提示]  └─ ' + message));
};

/**
 * 打印警告信息
 *
 * @param {String} message
 */
const warn = function(message) {
    console.warn(colors.yellow('[警告] ' + message));
};

/**
 * 打印错误信息
 *
 * @param {String} message
 * @param {Error} [error]
 */
const error = function(message, error) {
    console.error(colors.red('[错误] ' + message));
    if (error) {
        error.stack && console.error(colors.red(error.stack));
    }
};

exports.info = info;
exports.childInfo = childInfo;
exports.warn = warn;
exports.error = error;