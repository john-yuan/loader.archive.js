const path = require('path');

/**
 * 遍历对象
 *
 * @param {Object} object
 * @param {Function} callback
 */
const mapObject = function (object, callback) {
    for (let prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (callback(prop, object[prop], object) === false) {
                break;
            }
        }
    }
};

/**
 * 遍历数组
 *
 * @param {Array} array
 * @param {Function} callback
 */
const mapArray = function (array, callback) {
    for (let i = 0; i < array.length; i += 1) {
        if (callback(i, array[i], array) === false) {
            break;
        }
    }
};

/**
 * 获取文件相对路径
 *
 * @param {string} dirname
 * @param {string} filename
 */
const shortName = function (dirname, filename) {
    dirname = path.normalize(dirname);
    filename = path.normalize(filename);
    if (filename.indexOf(dirname) === 0) {
        filename = filename.substr(dirname.length);
    }
    return filename.replace(/\\+/g, '/').replace(/^\//, '');
};

/**
 * 检查某路径是否是指定路径的子路径
 *
 * @param {string} child
 * @param {string} parent
 */
const isChildPathOf = function (child, parent) {
    child = path.normalize(child);
    parent = path.normalize(parent);

    if (parent.slice(-1) !== path.sep) {
        parent = parent + path.sep;
    }

    return child.indexOf(parent) === 0;
};

/**
 * 格式化文件路径
 *
 * @param {string} filepath
 */
const normalizePath = function (filepath) {
    filepath = filepath.replace(/\\+/g, '/');
    return filepath;
};

/**
 * 判断是不是绝对链接
 *
 * @param {string} url
 */
const isAbsoluteURL = function (url) {
    return /^(?:[a-z][a-z0-9\-\.\+]*:)?\/\//i.test(url);
};

exports.mapObject = mapObject;
exports.mapArray = mapArray;
exports.shortName = shortName;
exports.normalizePath = normalizePath;
exports.isAbsoluteURL = isAbsoluteURL;
exports.isChildPathOf = isChildPathOf;
