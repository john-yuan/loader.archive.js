/**
 * 主页
 *
 * @author John Yuan
 * @module views/home/home
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var $ = require('libs/zepto');
    var loader = require('loader/loader');
    var toast = require('widgets/toast/toast');
    var $mRootElement = null;

    exports.render = function (event) {
        var cssText = require('loader/deps/text!./home.less');
        var htmlText = require('loader/deps/text!./home.tpl');
        var rootElement = loader.view.render(module, cssText, htmlText);

        document.title = 'Home';

        $mRootElement = $(rootElement);

        $mRootElement.on('click', '.btn-demo', function () {
            loader.router.routeTo('demo', {
                from: 'home'
            });
        }).on('click', '.btn-toast', function () {
            toast.show('You just clicked me.');
        });

        console.log(event);
    };

    exports.destroy = function (event) {
        $mRootElement.off();

        $mRootElement = null;

        loader.view.destroy(module);

        console.log(event);
    };

    exports.onParamChange = function (event) {
        console.log(event);
    };
});