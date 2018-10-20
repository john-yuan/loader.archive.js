const fs = require('fs');
const path = require('path');
const printUtils = require('../../common/printUtils');

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        let sizeInfo = runtime.sizeInfo;

        sizeInfo.forEach(item => {
            if (item.hash && item.path) {
                let filepath = path.resolve(runtime.out, item.path);
                try {
                    fs.utimesSync(filepath, 60, 60);
                } catch(e) {
                    printUtils.warn(`更新文件最后修改时间失败! ${filepath}`);
                }
            }
        });

        resolve(runtime);
    });
};

module.exports = main;
