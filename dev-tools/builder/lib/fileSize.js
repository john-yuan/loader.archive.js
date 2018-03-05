const fs = require('fs');

/**
 * 获取文件大小
 *
 * @param {String} filename 文件名
 * @returns {Number}
 */
const fileSize = function(filename) {
    try {
        let stat = fs.statSync(filename);
        return stat.size || 0;
    } catch(e) {
        return 0;
    }
};

module.exports = fileSize;