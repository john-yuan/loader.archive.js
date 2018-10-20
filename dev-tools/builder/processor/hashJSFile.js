const path = require('path');
const utils = require('../../common/utils');
const fileSize = require('../../common/fileSize');
const saveHashFile = require('../../common/saveHashFile');
const mapArray = utils.mapArray;

const hashModule = function (runtime, moduleName) {
    let filepath = path.resolve(runtime.wdBaseDir, moduleName + '.js');
    let res = saveHashFile(filepath, runtime.config.hashSize || 7);
    let hash = res.hash;
    let newModuleName = moduleName + '-' + hash;
    runtime.paths[moduleName] = newModuleName;
    runtime.sizeInfo.push({
        name: utils.shortName(runtime.wd, filepath),
        path: utils.shortName(runtime.wd, res.path),
        hash: hash,
        size: fileSize(filepath)
    });
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        try {
            mapArray(runtime.moduleInUse, (index, moduleName) => {
                hashModule(runtime, moduleName);
            });
            mapArray(runtime.nonStandardAmdModules, (index, moduleName) => {
                hashModule(runtime, moduleName);
            });
        } catch (e) {
            return reject(e);
        }
        resolve(runtime);
    });
};

module.exports = main;
