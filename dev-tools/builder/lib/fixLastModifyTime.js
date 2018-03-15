/**
 * 修改 hash 过的文件的最后修改时间
 */

const fs = require('fs');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {

        let paths = runtime.paths || {};
        let srcPath = path.resolve(runtime.out, runtime.rjsConfig.baseUrl || '');

        for (let mod in paths) {
            if (paths.hasOwnProperty(mod)) {
                let filename = paths[mod] + '.js';
                let filepath = path.resolve(srcPath, filename);
                try {
                    fs.utimesSync(filepath, 60, 60);
                } catch(e) {
                    printUtils.warn(`更新文件最后修改时间失败! ${filepath}`);
                }
            }
        }

        resolve(runtime);
    });
};