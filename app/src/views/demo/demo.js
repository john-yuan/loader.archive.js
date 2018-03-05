/**
 * 主页
 *
 * @author John Yuan
 * @module views/demo/demo
 * @version 1.0.0
 */
define(function(require, exports, module) {
    var $ = require('libs/zepto');
    var loader = require('loader/loader');
    var $mRootElement = null;

    exports.render = function(event) {
        var cssText = require('loader/deps/text!./demo.less');
        var htmlText = require('loader/deps/text!./demo.tpl');
        var rootElement = loader.view.render(module, cssText, htmlText);

        document.title = 'Demo';

        $mRootElement = $(rootElement);

        $mRootElement.on('click', '.btn-home', function() {
            loader.router.routeTo('home');
        });

        console.log(event);
    };

    exports.destroy = function(event) {
        $mRootElement.off();

        $mRootElement = null;

        loader.view.destroy(module);

        console.log(event);
    };

    exports.onParamChange = function(event) {
        console.log(event);
    };
});