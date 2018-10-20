const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const ejs = require('ejs');
const utils = require('../common/utils');
const printUtils = require('../common/printUtils');

/**
 * 创建器
 *
 * @param {object} options
 * @param {string} options.moduleId
 * @param {string} options.moduleDir 如果指定了 moduleId 此选项无效
 * @param {string} options.tempName
 * @param {string} options.tempDir
 * @param {string} options.baseDir
 * @param {string} options.outputDir
 * @param {Array} options.args
 */
const Creator = function (options) {
    options = options || {};

    this.options = options;

    this.fetchData();

    options.name = options.name || '模块';

    printUtils.info(`创建${options.name}: ${options.moduleId}`);
    printUtils.info(`使用模板: ${options.tempName}`);

    if (options.args && options.args.length) {
        printUtils.info(`模板参数: ${options.args.join(', ')}`);
    }

    this.loadTemplates();

    printUtils.info(`创建${options.name}完成!\n`);
};

Creator.prototype.fetchData = function () {
    let data = {};
    let options = this.options;
    let moduleId = options.moduleId;
    let moduleDir = options.moduleDir;

    if (moduleId) {
        moduleId = options.moduleId;
    } else if (moduleDir) {
        moduleDir = moduleDir.replace(/\\+/g, '/');
        moduleDir = moduleDir.replace(/\/+/g, '/');
        moduleDir = moduleDir.replace(/^\//, '');
        moduleDir = moduleDir.replace(/\/$/, '');
        moduleDir = moduleDir.split('/');
        moduleDir.push(moduleDir[moduleDir.length - 1]);
        moduleId = moduleDir.join('/');
    }

    moduleId = moduleId.replace(/\\+/g, '/');
    moduleId = moduleId.replace(/\/+/g, '/');
    moduleId = moduleId.replace(/^\//, '');
    moduleId = moduleId.replace(/\/$/, '');

    moduleDir = moduleId.split('/');
    moduleDir.pop();
    moduleDir = moduleDir.join('/');

    options.moduleId = moduleId;
    options.moduleDir = moduleDir;

    let basename = moduleId.split('/').pop();

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    month = month < 10 ? ('0' + month) : month;
    day = day < 10 ? ('0' + day) : day;

    data.moduleId = moduleId;
    data.basename = basename;
    data.date = [year, month, day].join('-');
    data.args = options.args;
    data.hasConfig = function (name) {
        let args = options.args;
        for (let i = 0; i < args.length; i += 1) {
            if (args[i] === name) {
                return true;
            }
        }
        return false;
    };

    this.data = data;
};

Creator.prototype.loadTemplates = function () {
    let tempDir = path.resolve(this.options.tempDir, this.options.tempName);

    if (!utils.isChildPathOf(tempDir, this.options.tempDir)) {
        throw new Error(
            `模板目录不在指定目录下!\n模板目录${tempDir}\n指定目录${this.options.tempDir}`
        );
    }

    let stat;

    try {
        stat = fs.statSync(tempDir);
    } catch (e) {
        throw new Error(`模板目录不存在 ${tempDir}\n${e.stack}`);
    }

    if (!stat.isDirectory()) {
        throw new Error(`${tempDir} 不是一个文件夹`);
    }

    let options = this.options;
    let templates = options.templates;

    if (templates.html) {
        let tempPath = path.resolve(tempDir, 'html.ejs');
        let template = '';
        try {
            template = fs.readFileSync(tempPath).toString();
        } catch (e) {
            printUtils.warn(`HTML 模板不存在，使用空模板!`);
        }
        let shortName = options.moduleId + '.tpl';
        let filepath = path.resolve(options.baseDir, shortName);
        this.createTemplate('HTML', filepath, shortName, template);
    }
    if (templates.less) {
        let tempPath = path.resolve(tempDir, 'less.ejs');
        let template = '';
        try {
            template = fs.readFileSync(tempPath).toString();
        } catch (e) {
            printUtils.warn(`LESS 模板不存在，使用空模板!`);
        }
        let shortName = options.moduleId + '.less';
        let filepath = path.resolve(options.baseDir, shortName);
        this.createTemplate('LESS', filepath, shortName, template);
    }
    if (templates.javascript) {
        let tempPath = path.resolve(tempDir, 'javascript.ejs');
        let template = '';
        try {
            template = fs.readFileSync(tempPath).toString();
        } catch (e) {
            printUtils.warn(`JavaScript 模板不存在，使用空模板!`);
        }
        let shortName = options.moduleId + '.js';
        let filepath = path.resolve(options.baseDir, shortName);
        this.createTemplate('JavaScript', filepath, shortName, template);
    }

};

Creator.prototype.createTemplate = function (name, filepath, shortName, template) {
    if (fse.pathExistsSync(filepath)) {
        printUtils.warn(`文件 ${shortName} 已存在，跳过此文件。`);
    } else {
        let textContent;
        try {
            textContent = ejs.render(template, {
                data: this.data
            });
        } catch (e) {
            throw new Error(`编译 ${name} 模板失败!\n${e.stack}`);
        }
        try {
            fse.outputFileSync(filepath, textContent);
        } catch (e) {
            throw new Error(`保存文件 ${shortName} 失败!\n${e.stack}`);
        }
        printUtils.info(`已创建 ${shortName}`);
    }
};

module.exports = Creator;
