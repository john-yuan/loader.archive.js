const filesize = require('filesize');
const colors = require('colors');
const printUtils = require('../../common/printUtils');

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
            if (text === null || text === undefined) {
                text = 'N/A';
            } else if (typeof text !== 'string') {
                text = '' + text;
            }
            item[name] = text;
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
        tableText.push(rowText.join(' | ').replace(/\s+$/, ''));
    });
    return tableText.join('\n');
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let sizeInfo = runtime.sizeInfo.slice(0);
        let newSizeInfo = [];

        sizeInfo = sizeInfo.sort((a, b) => {
            return a.size - b.size;
        });

        sizeInfo.forEach(function (item, index) {
            let size = filesize(item.size, {
                output: 'object'
            });

            if (size.symbol === 'B') {
                size.value = size.value / 2014;
                size.suffix = 'KB';
            }

            newSizeInfo.push({
                order: (index + 1) + '.',
                sizeText: size.value.toFixed(2) + ' ' + size.suffix,
                hash: item.hash,
                name: item.name
            });
        });

        let buildResult = renderTable([
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
                name: 'name'
            }
        ], newSizeInfo);

        runtime.buildResult = buildResult;

        console.log();
        console.log(buildResult);
        console.log();

        let warnList = printUtils.getData().warnList;
        if (warnList.length) {
            console.log(colors.yellow(warnList.join('\n')));
            console.log();
        }

        resolve(runtime);
    });
};

module.exports = main;
