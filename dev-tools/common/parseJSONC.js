/**
 * 解析 JOSNC 文本
 *
 * @param {String} JSONCText 原始文本
 * @returns {any}
 * @throws {Error}
 */
const parseJSONC = function (JSONCText) {
    let type = 0;
    let char = '';
    let index = 0;
    let length = JSONCText.length;
    let charList = [];

    while(index < length) {
        char = JSONCText[index];
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
    JSONCText = charList.join('');
    return JSON.parse(JSONCText);
};

module.exports = parseJSONC;
