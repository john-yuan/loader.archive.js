const crypto = require('crypto');

/**
 * 计算 md5 hash 值
 *
 * @param {String} text
 */
const md5 = function (text) {
    let hash = crypto.createHash('md5');
    hash.update(text || '');
    return hash.digest('hex');
};

module.exports = md5;
