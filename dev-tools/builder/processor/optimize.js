const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const utils = require('../../common/utils');
const walkDirSync = require('../../common/walkDirSync');
const mapObject = utils.mapObject;
const mapArray = utils.mapArray;
const normalizePath = utils.normalizePath;

const findAllViews = function (runtime) {
    let viewsDir = path.resolve(runtime.wdBaseDir, 'views');
    try {
        fse.ensureDirSync(viewsDir);
    } catch (e) {
        throw new Error(`创建视图文件夹出错!\n${err.message}`);
    }
    walkDirSync(viewsDir, function (filepath) {
        if (/\.js$/i.test(filepath)) {
            let names = normalizePath(filepath).split('/');
            let dirname = names[names.length - 2];
            let filename = names[names.length - 1];
            if (dirname && filename) {
                filename = filename.replace(/\.js$/i, '');
                if (filename === dirname) {
                    let viewDepName = normalizePath(filepath.replace(runtime.wdBaseDir, ''));
                    viewDepName = viewDepName.replace(/^\//, '');
                    viewDepName = viewDepName.replace(/\.js$/i, '');
                    runtime.views.push(viewDepName);
                }
            }
        }
    }, function (err) {
        throw new Error(`遍历视图文件夹出错!\n${err.message}`);
    });
};

const resolveRelativeDepName = function (parentDepName, subDebName) {
    let paths = parentDepName.split('/');
    let normalized = [];

    paths.pop();
    paths = paths.concat(subDebName.split('/'));

    while (paths.length) {
        let name = paths.shift();
        if (name === '.') {

        } else if (name === '..') {
            normalized.pop();
        } else {
            normalized.push(name);
        }
    }

    return normalized.join('/');
};

const handleSpecialDeps = function (runtime, moduleName, moduleDeps) {
    let filteredDeps = [];

    moduleDeps.forEach(function (depName) {
        if (depName.indexOf('!') > -1) {
            // 忽略插件
        } else if (['require', 'exports', 'module'].indexOf(depName) > -1) {
            // 忽略特殊依赖
        } else {
            if (/^((\.\/)|(\.\.\/))/.test(depName)) {
                depName = resolveRelativeDepName(moduleName, depName);
            }
            if (runtime.moduleInfo[depName]) {
                if (runtime.moduleInfo[depName].amd) {
                    filteredDeps.push(depName);
                } else {
                    pushNonStandardAmdModules(runtime, depName);
                }
            }
        }
    });

    return filteredDeps;
};

const pushNonStandardAmdModules = function (runtime, depName) {
    if (runtime.nonStandardAmdModules.indexOf(depName) === -1) {
        if (runtime.moduleInUse.indexOf(depName) === -1) {
            runtime.nonStandardAmdModules.push(depName);
        }
    }
};

const normalizeDeps = function (runtime) {
    let depsInfo = runtime.depsInfo;
    let moduleDeps = runtime.moduleDeps;

    mapObject(depsInfo, (moduleName, deps) => {
        moduleDeps[moduleName] = handleSpecialDeps(runtime, moduleName, depsInfo[moduleName] || []);
    });
};

const findViewDeps = function (runtime) {
    let moduleDeps = runtime.moduleDeps;

    runtime.views.forEach(viewDepName => {
        if (moduleDeps.hasOwnProperty(viewDepName)) {
            let viewDeps = moduleDeps[viewDepName] || [];
            runtime.viewDeps[viewDepName] = viewDeps;
        }
    });
};

const fetchRequiredBy = function (runtime) {
    let requiredBy = runtime.requiredBy;
    let addRequiredBy = function (moduleName, parentModuleName) {
        if (!requiredBy[moduleName]) {
            requiredBy[moduleName] = [];
        }
        requiredBy[moduleName].push(parentModuleName);
    };

    mapObject(runtime.moduleDeps, function (moduleName, moduleDeps) {
        mapArray(moduleDeps, function (index, depName) {
            addRequiredBy(depName, moduleName);
        });
    });
};

const parseBundles = function (runtime) {
    let requiredBy = {};
    let containsInfo = {};
    let loaderDeps = [];
    let pulbicDeps = [];
    let bundles = runtime.bundles;
    let standalone = runtime.standalone;
    let includeInLoader = runtime.config.includeInLoader || [];
    let excludeInLoader = runtime.config.excludeInLoader || [];
    let autoIncludeModuleSize = runtime.config.autoIncludeModuleSize || 0;

    loaderDeps.push('loader/plugin/text');
    loaderDeps.push('loader/plugin/ejs');

    mapObject(runtime.requiredBy, function (key, values) {
        if (key.indexOf('loader/') !== 0 && key.indexOf('runtime/') !== 0) {
            if (values) {
                if (values.length === 1) {
                    let value = values[0];
                    if (value && value.indexOf('loader/') !== 0) {
                        requiredBy[key] = value;
                    }
                } else if (values.length > 1) {
                    let size = 0;
                    if (runtime.moduleInfo[key]) {
                        size = runtime.moduleInfo[key].size || 0;
                    }
                    let sizeText = (size / 1024).toFixed(2) + 'KB';

                    if (includeInLoader.indexOf(key) !== -1) {
                        pulbicDeps.push(key);
                    } else if (excludeInLoader.indexOf(key) !== -1) {
                        standalone[key] = sizeText;
                    } else {
                        let hasView = false;
                        mapArray(values, function (index, depName) {
                            if (depName.indexOf('views/') === 0) {
                                hasView = true;
                                return false;
                            }
                        });
                        if (hasView) {
                            if (size <= autoIncludeModuleSize) {
                                pulbicDeps.push(key);
                            } else {
                                standalone[key] = sizeText;
                            }
                        } else {
                            standalone[key] = sizeText;
                        }
                    }
                }
            }
        } else {
            if (key.indexOf('loader/') === 0 && key !== 'loader/loader') {
                if (loaderDeps.indexOf(key) === -1) {
                    loaderDeps.push(key);
                }
            }
        }
    });

    loaderDeps.push('runtime/hooks');
    loaderDeps.push('loader/loader');

    mapObject(requiredBy, function (moduleName, parentModuleName) {
        if (containsInfo[parentModuleName]) {
            containsInfo[parentModuleName].push(moduleName);
        } else {
            containsInfo[parentModuleName] = [moduleName];
        }
    });

    let handledModuleArray = [];

    const findEndPoint = function (moduleName) {
        let endPointName = requiredBy[moduleName];
        handledModuleArray.push(moduleName);
        if (!endPointName) {
            return moduleName;
        } else {
            return findEndPoint(endPointName);
        }
    };

    const findDeps = function (endPointName) {
        let deps = [endPointName];
        let cursor = 0;

        for ( ; cursor < deps.length; cursor += 1) {
            let depName = deps[cursor];
            let contains = containsInfo[depName] || [];

            mapArray(contains, function (index, depName) {
                if (deps.indexOf(depName) === -1) {
                    deps.push(depName);
                }
            });
        }

        deps.forEach(function (depName, index) {
            if (index > 0) {
                runtime.bundled.push(depName);
            }
        });

        return deps.reverse();
    };

    mapObject(containsInfo, function (moduleName, moduleDeps) {
        if (handledModuleArray.indexOf(moduleName) > -1) {
            //
        } else {
            let endPointName = findEndPoint(moduleName);
            let deps = findDeps(endPointName);
            bundles[endPointName] = deps;

            standalone[endPointName] = null;
            delete standalone[endPointName];
            let index = pulbicDeps.indexOf(endPointName);
            if (index !== -1) {
                pulbicDeps.splice(index, 1);
            }
        }
    });

    loaderDeps = pulbicDeps.concat(loaderDeps);
    runtime.bundled = runtime.bundled.concat(loaderDeps);

    bundles['loader/loader'] = loaderDeps;
};

const readModuleContent = function (runtime, moduleName) {
    let modulePath = path.resolve(runtime.wdBaseDir, moduleName + '.js');
    let moduleContent;
    try {
        moduleContent = fs.readFileSync(modulePath).toString();
    } catch (e) {
        throw new Error(`读取文件失败!\n${e.message}`);
    }
    return moduleContent;
};

const saveModuleContent = function (runtime, moduleName, moduleContent) {
    let modulePath = path.resolve(runtime.wdBaseDir, moduleName + '.js');
    try {
        fs.writeFileSync(modulePath, moduleContent);
    } catch (e) {
        throw new Error(`保存文件失败!\n${e.message}`);
    }
};

const bundle = function (runtime) {
    mapObject(runtime.bundles, function (bundleName, moduleList) {
        let contentArray = [];
        mapArray(moduleList, function (index, moduleName) {
            contentArray.push(readModuleContent(runtime, moduleName));
        });
        saveModuleContent(runtime, bundleName, contentArray.join(';\n'));
    });
};

const fetchLoaderSizeDetails = function (runtime) {
    let moduleSize = {};
    mapArray(runtime.bundles['loader/loader'] || [], (index, name) => {
        let size = 0;
        if (runtime.moduleInfo[name]) {
            size = runtime.moduleInfo[name].size || 0;
        }
        let sizeText = (size / 1024).toFixed(2) + 'KB';
        moduleSize[name] = sizeText;
    });
    let textContent = readModuleContent(runtime, 'loader/loader');
    let size = textContent.length;
    let sizeText = (size / 1024).toFixed(2) + 'KB';

    runtime.loaderSizeDetails.totalSize = sizeText;
    runtime.loaderSizeDetails.moduleSize = moduleSize;
};

const fetchModuleInUse = function (runtime) {
    let moduleInUse = runtime.moduleInUse;

    moduleInUse.push('loader/loader');

    let addModuleInUse = function (moduleName) {
        if (moduleInUse.indexOf(moduleName) === -1) {
            if (runtime.bundled.indexOf(moduleName) === -1) {
                moduleInUse.push(moduleName);
            }
        }
    };

    mapObject(runtime.viewDeps, function (key, deps) {
        addModuleInUse(key);
        mapArray(deps || [], function (index, depName) {
            addModuleInUse(depName);
            mapArray(runtime.moduleDeps[depName] || [], function (index, depName) {
                addModuleInUse(depName);
            });
        });
    });
};

const main = function (runtime) {
    return new Promise(function (resolve, reject) {
        try {
            runtime.moduleDeps = {};
            runtime.viewDeps = {};
            runtime.requiredBy = {};
            runtime.bundled = [];
            runtime.views = [];
            runtime.paths = {};
            runtime.sizeInfo = [];
            runtime.nonStandardAmdModules = [];
            runtime.moduleInUse = [];
            runtime.bundles = {};
            runtime.loaderSizeDetails = {};
            runtime.standalone = {};
            findAllViews(runtime);
            normalizeDeps(runtime);
            findViewDeps(runtime);
            fetchRequiredBy(runtime);
            parseBundles(runtime);
            bundle(runtime);
            fetchLoaderSizeDetails(runtime);
            fetchModuleInUse(runtime);
        } catch (e) {
            return reject(e);
        }
        resolve(runtime);
    });
};

module.exports = main;
