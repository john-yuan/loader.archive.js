const path = require('path');
const Creator = require('../Creator');
const widgetName = (process.argv[2] || '').trim();
const printUtils = require('../../common/printUtils');
const DEFAULT = 'default';

if (widgetName) {
    try {
        new Creator({
            name: '组件',
            moduleDir: 'widgets/' + widgetName,
            baseDir: path.resolve(__dirname, '../../../app/src'),
            args: process.argv.slice(4),
            tempName: (process.argv[3] || DEFAULT).trim(),
            tempDir: path.resolve(__dirname, 'templates'),
            templates: {
                html: true,
                less: true,
                javascript: true
            }
        });
    } catch (e) {
        printUtils.error(e.stack);
    }
} else {
    printUtils.error('请输入组件名称');
    printUtils.warn('使用方式: npm run w <widget_name> [template]');
    console.log();
}
