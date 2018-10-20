const fs = require('fs');

/**
 * 获取文件大小
 *
 * @param {String} filename 文件名
 * @returns {Number}
 */
const fileSize = function (filename) {
    try {
        let stat = fs.statSync(filename);
        return stat.size || 0;
    } catch (e) {
        throw new Error(`获取文件大小信息失败! ${filename}\n${e.stack}`);
    }
};

module.exports = fileSize;
