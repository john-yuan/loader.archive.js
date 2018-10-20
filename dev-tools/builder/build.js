const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const uuidV4 = require('uuid/v4');
const md5 = require('../common/md5');
const lock = require('../common/lock');
const utils = require('../common/utils');
const printUtils = require('../common/printUtils');
const parseJSONC = require('../common/parseJSONC');

const DIR_WORKSPACE = path.resolve(__dirname, 'workspace');
const PATH_BUILD_ID = path.resolve(DIR_WORKSPACE, 'buildId');
const PATH_LOCKFILE = path.resolve(DIR_WORKSPACE, 'lockfile');
const PAHT_CONFIG = path.resolve(process.cwd(), process.argv[2] || 'build.config.jsonc');

const readConfig = function (filepath) {
    let textContent;
    let config;

    try {
        textContent = fs.readFileSync(filepath).toString();
    } catch (e) {
        throw new Error(`读取配置文件失败!\n${e.stack}`);
    }

    try {
        config = parseJSONC(textContent);
    } catch (e) {
        throw new Error(`解析配置文件失败!\n${e.stack}`);
    }

    if ({}.toString.call(config) !== '[object Object]') {
        throw new Error(`配置文件错误! ${filepath}`);
    }

    if (typeof config.in !== 'string') {
        throw new Error(`请指定输入目录! ${filepath}`);
    }

    if (typeof config.out !== 'string') {
        throw new Error(`请指定输出目录! ${filepath}`);
    }

    return config;
};

const getBuildId = function (filepath) {
    let buildId;

    if (fse.pathExistsSync(filepath)) {
        try {
            buildId = fs.readFileSync(filepath).toString();
        } catch (e) {
            throw new Error(`读取构建ID文件失败!\n${e.stack}`);
        }
        buildId = parseInt(buildId, 10);
        if (isNaN(buildId)) {
            printUtils.warn('检测到构建ID已被修改为非数字, 默认重置.');
            buildId = 0;
        }
    } else {
        buildId = 0;
    }

    buildId += 1;

    try {
        fse.outputFileSync(filepath, buildId);
    } catch (e) {
        throw new Error(`保存构建ID文件失败!\n${e.stack}`);
    }

    return buildId;
};

let config;

try {
    config = readConfig(PAHT_CONFIG);
} catch (e) {
    printUtils.error(e.message);
    process.exit();
}

let runtime = { config: config };

lock(PATH_LOCKFILE, 5000, 100).then(unlock => {
    // 生成构建ID
    let printError = err => {
        throw new Error(`移除锁文件失败, 请手动删除该文件! ${PATH_LOCKFILE}\n${err.stack}`);
    };
    try {
        runtime.id = getBuildId(PATH_BUILD_ID);
    } catch (e) {
        printUtils.error(e.message);
        unlock(printError);
    }
    unlock(printError);

    // 保存路径信息
    runtime.serialNo = [md5(Date.now().toString()), uuidV4(), runtime.id].join('.');
    runtime.in = path.resolve(path.dirname(PAHT_CONFIG), config.in);
    runtime.out = path.resolve(path.dirname(PAHT_CONFIG), config.out);
    runtime.wd = path.resolve(DIR_WORKSPACE, 'wd-' + runtime.id);

    if (runtime.in === runtime.out) {
        throw new Error(`输出目录不能和输入目录相同!\n输出目录: ${runtime.out}\n输入目录: ${runtime.in}`);
    } else if (utils.isChildPathOf(runtime.in, runtime.out)) {
        throw new Error(`输出目录不能是输入目录的父目录!\n输出目录: ${runtime.out}\n输入目录: ${runtime.in}`);
    } else if (utils.isChildPathOf(runtime.out, runtime.in)) {
        throw new Error(`输入目录不能是输出目录的父目录!\n输出目录: ${runtime.out}\n输入目录: ${runtime.in}`);
    }

    printUtils.info(`构建编号: ${runtime.id}`);
    printUtils.info(`构建序列: ${runtime.serialNo}`);
    printUtils.info(`输入目录: ${runtime.in}`);
    printUtils.info(`输出目录: ${runtime.out}`);
    printUtils.info(`工作目录: ${runtime.wd}`);
    printUtils.info(`配置文件: ${PAHT_CONFIG}`);

    Promise
        .resolve(runtime)
        // 删除临时工作目录
        .then(require('./processor/deleteWorkingDirectory'))
        // 复制源代码
        .then(require('./processor/copySourceCode'))
        // 打包前删除指定文件
        .then(require('./processor/deleteFiles'))
        // 提取配置信息
        .then(require('./processor/fetchRjsConfig'))
        // 压缩处理 tpl 文件
        .then(require('./processor/processTpl'))
        // 压缩处理 less(含css) 文件
        .then(require('./processor/processLess'))
        // 压缩处理 js 文件并处理 require.js 插件和记录依赖信息
        .then(require('./processor/processJs'))
        // 优化打包
        .then(require("./processor/optimize"))
        // 计算模块哈希值和文件大小信息
        .then(require("./processor/hashJSFile"))
        // 处理入口文件
        .then(require("./processor/processEntry"))
        // 处理 HTML 文件
        .then(require("./processor/processHtml"))
        // 打印文件大小信息
        .then(require("./processor/printSizeInfo"))
        // 保存构建信息
        .then(require('./processor/saveBuildInfo'))
        // 移动处理后文件至输出目录
        .then(require('./processor/copyToOutDirectory'))
        // 更新文件最后修改时间
        .then(require('./processor/updateLastModifyTime'))
        // 输出错误信息并尝试删除工作目录
        .catch(err => {
            printUtils.error(`${err.stack}`);
            try {
                fse.removeSync(runtime.wd);
            } catch (e) {}
        });
}).catch(err => {
    if (err.LOCK_ERROR) {
        printUtils.error(`锁定文件失败, 请尝试手动删除锁文件 ${PATH_LOCKFILE}\n${err.stack}`);
    } else {
        printUtils.error(`${err.stack}`);
    }
});
