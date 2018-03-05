const fs = require('fs');
const path = require('path');

/**
 * 遍历文件夹（同步）
 *
 * @param {String} dir 文件夹路径
 * @param {Function} [onFile] 文件处理回调
 * @param {Function} [onError] 错误处理回调
 */
const walkDirSync = function(dir, onFile, onError) {
    var fileList;
    try {
        fileList = fs.readdirSync(dir);
    } catch(err) {
        onError && onError(err);
    }
    if (fileList) {
        fileList.forEach(function(filename) {
            var stat, filepath = path.resolve(dir, filename);
            try {
                stat = fs.statSync(filepath);
            } catch(err) {
                onError && onError(err);
            }
            if (stat) {
                if (stat.isDirectory()) {
                    walkDirSync(filepath, onFile, onError);
                } else if (stat.isFile()) {
                    onFile && onFile(filepath);
                }
            }
        });
    }
};

module.exports = walkDirSync;