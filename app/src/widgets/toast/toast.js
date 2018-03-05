/**
 * toast 弹窗组件
 *
 * @author John Yuan
 * @module widgets/toast/toast
 * @version 1.0.0
 */
define(function(require, exports, module) {
    var $ = require("libs/zepto");
    var loader = require("loader/loader");
    var toastTimerId = null, toastList = [], $mMain;

    var initialize = function() {
        var cssText = require("loader/deps/text!./toast.less");
        var htmlText = require("loader/deps/text!./toast.tpl");
        // 注册组件
        $mMain = $(loader.widget.append(module, cssText, htmlText));
        // 视图销毁后移除所有 toast
        loader.dispatcher.onViewDestroyed(clear);
        initialize = null;
    };

    /**
     * 显示toast
     *
     * @param {String} text 提示文本
     * @param {Function} cb 显示完成回调函数
     */
    var show = function(text, cb) {
        initialize && initialize();
        if (toastTimerId === null) {
            toastTimerId = 0;
            $mMain.find(".text").html(text);
            $mMain.show().animate({
                "opacity": "1"
            }, 150, "ease-in-out", function() {
                toastTimerId = setTimeout(function() {
                    $mMain.animate({
                        "opacity": "0"
                    }, 150, "ease-in-out", function() {
                        var nextToast;
                        $mMain.hide();
                        cb && cb();
                        nextToast = toastList.shift();
                        toastTimerId = null;
                        if (nextToast) {
                            exports.show.apply(null, nextToast);
                        }
                    });
                }, 1700);
            });
        } else {
            toastList.push(arguments);
        }
    };

    /**
     * 清除所有显示队列并隐藏 toast
     */
    var clear = function() {
        $mMain && $mMain.hide();
        clearTimeout(toastTimerId);
        while(toastList.length) {
            toastList.pop();
        }
        toastTimerId = null;
    };

    exports.show = show;
    exports.clear = clear;
});