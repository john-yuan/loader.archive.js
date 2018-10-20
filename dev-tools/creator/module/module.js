const path = require('path');
const Creator = require('../Creator');
const moduleId = (process.argv[2] || '').trim();
const printUtils = require('../../common/printUtils');
const DEFAULT = 'default';

if (moduleId) {
    try {
        new Creator({
            name: '模块',
            moduleId: moduleId,
            baseDir: path.resolve(__dirname, '../../../app/src'),
            args: process.argv.slice(4),
            tempName: (process.argv[3] || DEFAULT).trim(),
            tempDir: path.resolve(__dirname, 'templates'),
            templates: {
                html: false,
                less: false,
                javascript: true
            }
        });
    } catch (e) {
        printUtils.error(e.stack);
    }
} else {
    printUtils.error('请输入模块名称');
    printUtils.warn('使用方式: npm run m <module_id>');
    console.log();
}
