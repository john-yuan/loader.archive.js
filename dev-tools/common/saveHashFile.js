const fs = require('fs');
const md5 = require('./md5');
const path = require('path');

/**
 * 计算一个文件的哈希值，并以此哈希值为后缀保存文件
 *
 * @param {string} filepath
 * @param {number} [hashSize]
 * @return {string} 文件的哈希值
 */
const saveHashFile = function (filepath, hashSize) {
    let textContent;

    try {
        textContent = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取文件失败!${filepath}\n${e.stack}`);
    }

    let hash = md5(textContent);

    if (hashSize) {
        hash = hash.substr(0, hashSize);
    }

    let id = 0;
    let info = path.parse(filepath);
    let finalHash = hash;
    let checkPath = function (filepath, textContent) {
        if (fs.existsSync(filepath)) {
            let oldContent;
            try {
                oldContent = fs.readFileSync(filepath).toString();
            } catch (e) {
                throw new Error(`读取文件失败! ${filepath}\n${e.stack}`);
            }
            return oldContent !== textContent;
        }
        return false;
    };
    do {
        if (id) {
            finalHash = hash + '-' + id;
        }
        filepath = path.resolve(info.dir, info.name + '-' + finalHash + info.ext)
        id += 1;
    } while (checkPath(filepath, textContent));

    try {
        fs.writeFileSync(filepath, textContent);
    } catch (e) {
        throw new Error(`保存文件失败!${filepath}\n${e.stack}`);
    }

    return {
        hash: finalHash,
        path: filepath
    };
};

module.exports = saveHashFile;
