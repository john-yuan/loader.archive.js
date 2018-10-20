const path = require('path');
const Creator = require('../Creator');
const viewName = (process.argv[2] || '').trim();
const printUtils = require('../../common/printUtils');
const DEFAULT = 'default';

if (viewName) {
    try {
        new Creator({
            name: '视图',
            moduleDir: 'views/' + viewName,
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
    printUtils.error('请输入视图名称');
    printUtils.warn('使用方式: npm run v <view_name> [template]');
    console.log();
}
