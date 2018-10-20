const colors = require('colors');
const warnList = [];
const errorList = [];
const infoList = [];
const outputList = [];

/**
 * 打印提示信息
 *
 * @param {string} message
 */
const info = function (message) {
    message = '[提示] ' + message;
    infoList.push(message);
    outputList.push(message);
    console.info(colors.green(message));
};

/**
 * 打印次级提示信息
 *
 * @param {string} message
 */
const subInfo = function (message) {
    message = '[提示]  └─ ' + message;
    infoList.push(message);
    outputList.push(message);
    console.info(colors.gray(message));
};

/**
 * 打印警告信息
 *
 * @param {string} message
 */
const warn = function (message) {
    message = '[警告] ' + message;
    warnList.push(message);
    outputList.push(message);
    console.warn(colors.yellow(message));
};

/**
 * 打印错误信息
 *
 * @param {string} message
 * @param {Error} [error]
 */
const error = function (message, error) {
    message = '[错误] ' + message;
    errorList.push(message);
    outputList.push(message);
    console.error(colors.red(message));
    if (error) {
        outputList.push(error.stack);
        error.stack && console.error(colors.red(error.stack));
    }
};

/**
 * 获取日志信息
 *
 * @returns {object}
 */
const getData = function () {
    return {
        infoList: infoList.slice(),
        warnList: warnList.slice(),
        errorList: errorList.slice(),
        outputList: outputList.slice()
    };
};

exports.info = info;
exports.subInfo = subInfo;
exports.warn = warn;
exports.error = error;
exports.getData = getData;
