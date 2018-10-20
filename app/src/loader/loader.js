/**
 * 加载器模块
 *
 * @author John Yuan
 * @module loader/loader
 * @version 1.0.0
 */
define(function (require, exports, module) {
    window.loader = exports;

    exports.dispatcher = require('./core/dispatcher');
    exports.router = require('./core/router');
    exports.view = require('./core/view');
    exports.widget = require('./core/widget');

    exports.dispatcher.launch();
});