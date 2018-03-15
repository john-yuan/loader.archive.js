/**
 * 提取构建信息保存至 runtime.buildInfoText
 */

const fse = require('fs-extra');
const path = require('path');
const colors = require('colors');
const filesize = require('filesize');
const printUtils = require('./printUtils');

let runtime = {};

const renderTable = function (layout, data) {
    let maxLength = {};
    let tableText = [];
    let addSpaces = function (text, length, before) {
        let num = length - text.length;
        let spaces = Array(num + 1).join(' ');
        if (before) {
            text = spaces + text;
        } else {
            text += spaces;
        }
        return text;
    };
    data.forEach(function (item) {
        layout.forEach(function (info) {
            let name = info.name;
            let text = item[name];
            maxLength[name] = Math.max(maxLength[name] || 0, text.length);
        });
    });
    data.forEach(function (item) {
        let rowText = [];
        layout.forEach(function (info) {
            let name = info.name;
            let text = item[name];
            rowText.push(addSpaces(text, maxLength[name] || 0, info.alignRight));
        });
        tableText.push(rowText.join(' | ').trim());
    });
    return tableText.join('\n');
};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {
        let fileSize = runtime.fileSize.sort(function (a, b) {
            return a.size - b.size;
        });

        fileSize.forEach(function (item, index) {
            let sizeInfo = filesize(item.size, {
                output: 'object'
            });

            if (sizeInfo.symbol === 'B') {
                sizeInfo.value = sizeInfo.value / 2014;
                sizeInfo.suffix = 'KB';
            }

            let value = sizeInfo.value.toFixed(2);

            item.order = (index + 1) + '.';
            item.sizeText = value + ' ' + sizeInfo.suffix;
            item.hash = runtime.hash[item.module];
        });

        let buildInfoText = renderTable([
            {
                name: 'order',
                alignRight: true
            },
            {
                name: 'hash'
            },
            {
                name: 'sizeText',
                alignRight: false
            },
            {
                name: 'module'
            }
        ], fileSize);

        runtime.buildInfoText = buildInfoText;

        resolve(runtime);
    });
};