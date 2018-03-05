const fs = require('fs');
const fse = require('fs-extra');
const path = require('path')
const uuidV4 = require('uuid/v4');
const md5 = require('./lib/md5');
const printUtils = require('./lib/printUtils');
const cleanJOSNText = require('./lib/cleanJSONText');
const buildIdPath = path.resolve(__dirname, 'workspace/buildId');

// 读取配置文件
let config, configPath, configJSONText;

configPath = path.resolve(process.cwd(), process.argv[2] || 'build.config.json');

try {
    configJSONText = fs.readFileSync(configPath).toString();
} catch(e) {
    printUtils.error(`读取配置文件失败! ${configPath}`, e);
    process.exit(1);
}

try {
    config = JSON.parse(cleanJOSNText(configJSONText));
} catch(e) {
    console.log(`${configJSONText}\n`);
    printUtils.error('解析配置信息失败!', e);
    process.exit(1);
}

if ({}.toString.call(config) !== '[object Object]') {
    console.log(`${configJSONText}\n`);
    printUtils.error('配置信息错误!');
    process.exit(1);
}

// 检查配置信息
if (typeof config.in !== 'string') {
    printUtils.error('配置文件中未指定输入目录(in)!');
    process.exit(1);
}

if (typeof config.out !== 'string') {
    printUtils.error('配置文件中未指定输出目录(out)!');
    process.exit(1);
}

// 更新构建编号
let buildId = 0;
let lockStartTime = Date.now();
let lockfilePath = path.resolve(__dirname, 'workspace/lock');
let maxWaitTime = 10000;

while (fse.pathExistsSync(lockfilePath)) {
    let currentTime = Date.now();
    if (currentTime - lockStartTime >= maxWaitTime) {
        printUtils.error(`锁定计数器超时! 请尝试手动删除锁文件 ${lockfilePath}`);
        process.exit(1);
    }
    while((Date.now() - currentTime) < 500) {}
}

try {
    fse.outputFileSync(lockfilePath, new Date());
} catch(e) {
    printUtils.error('创建锁定文件失败!');
    process.exit(1);
}

try {
    buildId = parseInt(fs.readFileSync(buildIdPath).toString(), 10);
} catch(e) {

}

if (buildId === 0 || isNaN(buildId)) {
    buildId = 1;
}

try {
    fse.outputFileSync(buildIdPath, buildId + 1);
} catch(e) {
    printUtils.error('更新构建编号失败!', e);
    try {
        fse.removeSync(lockfilePath);
    } catch(e) {
        printUtils.error(`删除锁文件失败! 请手动删除 ${lockfilePath}`);
    }
    process.exit(1);
}

try {
    fse.removeSync(lockfilePath);
} catch(e) {
    printUtils.error(`删除锁文件失败! 请手动删除 ${lockfilePath}`);
    process.exit(1);
}

// 保存运行时信息
let runtime = {};

runtime.buildId = buildId;
runtime.buildUUID = [uuidV4(), md5(Date.now().toString()), buildId].join('.');
runtime.config = config;
runtime.in = path.resolve(path.dirname(configPath), config.in);
runtime.out = path.resolve(path.dirname(configPath), config.out);
runtime.tempDir = path.resolve(__dirname, 'workspace/temp-' + buildId);

// 打印构建信息
printUtils.info(`构建序号: ${runtime.buildId}`);
printUtils.info(`配置文件: ${configPath}`);
printUtils.info(`输入目录: ${runtime.in}`);
printUtils.info(`输出目录: ${runtime.out}`);
printUtils.info(`构建目录: ${runtime.tempDir}`);
printUtils.info(`构建编号: ${runtime.buildUUID}`);

// 开始构建
Promise.resolve(runtime)
    .then(require('./lib/cleanTempDir'))
    .then(require('./lib/copySourceCode'))
    .then(require('./lib/deleteFiles'))
    .then(require('./lib/fetchRjsConfig'))
    .then(require('./lib/compressTpl'))
    .then(require('./lib/compressCss'))
    .then(require('./lib/compressJs'))
    .then(require('./lib/parsePaths'))
    .then(require('./lib/compressHtml'))
    .then(require('./lib/compressEntry'))
    .then(require('./lib/fetchBuildInfo'))
    .then(require('./lib/saveBuildInfo'))
    .then(require('./lib/copyBuildCode'))
    .then(require('./lib/fixLastModifyTime'))
    .then(require('./lib/printBuildInfo'))
    .catch(function(error) {
        fse.remove(runtime.tempDir, function(err) {
            if (err) {
                printUtils.error(`删除临时目录失败! 请手动删除 ${runtime.tempDir}`, err);
            }
            printUtils.error('构建失败!', error);
        });
    });
