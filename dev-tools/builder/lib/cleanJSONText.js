/**
 * 移除 JSON 文本中的注释
 *
 * @param {String} rawJSONText 原始文本
 * @returns {String} 移除注释之后的 JSON
 */
const cleanJSONText = function (rawJSONText) {
    var type = 0;
    var char = '';
    var index = 0;
    var length = rawJSONText.length;
    var charList = [];

    while(index < length) {
        char = rawJSONText[index];
        index += 1;

        if (type === 0) {
            if (char === '"') {
                type = 1;
                charList.push(char);
            } else if (char === '/') {
                type = 2;
            } else {
                charList.push(char);
            }
        } else if (type === 1) {
            charList.push(char);
            if (char === '"') {
                type = 0;
            }
        } else if (type === 2) {
            if (char === '/') {
                type = 3;
            } else if (char === '*') {
                type = 4;
            } else {
                charList.push(char);
            }
        } else if (type === 3) {
            if (char === '\r' || char === '\n') {
                charList.push(char);
                type = 0;
            }
        } else if (type === 4) {
            if (char === '*') {
                type = 5;
            }
        } else if (type === 5) {
            if (char === '/') {
                type = 0;
            } else if (char === '*') {
                type = 5;
            } else {
                type = 4;
            }
        }
    }
    return charList.join('');
};

module.exports = cleanJSONText;