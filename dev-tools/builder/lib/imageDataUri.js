const fs = require('fs');
const mime = require('mime');

/**
 * 将图片转换为 DataUri
 *
 * @param {String} imagePath 图片路径
 * @returns {String}
 * @throws {Error}
 */
const imageDataUri = function (imagePath) {
    let mimetype = mime.lookup(imagePath);
    let image = fs.readFileSync(imagePath);
    let dataUrl = 'data:' + (mimetype ? (mimetype + ';') : '') + 'base64,';

    return JSON.stringify(dataUrl + image.toString('base64'));
};

module.exports = imageDataUri;