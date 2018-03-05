define(function(require, exports, module) {
    // 引入加载器模块
    var loader = require('loader/loader');

    /**
     * 渲染视图接口
     *
     * 当需要渲染此视图时，系统会调用方法以渲染视图
     *
     * @param {RenderEvent} event 渲染事件对象
     * @returns {void}
     */
    exports.render = function(event) {
        // 引入视图样式文件
        var cssText = require('loader/deps/text!./test.less');
        // 引入视图HTML文件
        var htmlText = require('loader/deps/text!./test.tpl');
        // 调用 loader.view.render API 渲染视图，并获取视图根元素
        var rootElement = loader.view.render(module, cssText, htmlText);

        document.title = 'Test';

        console.log(event);
    };

    /**
     * 销毁视图接口
     *
     * 当需要此视图时，系统会调用此方法以销毁视图
     *
     * @param {DestroyEvent} event 销毁事件对象
     * @returns {void}
     */
    exports.destroy = function(event) {
        // 调用 loader.view.destroy API 销毁视图
        loader.view.destroy(module);
        console.log(event);
    };

    /**
     * 监听参数改变接口（如果不需要的话，可以不用实现）
     *
     * 当此视图的 hash 参数改变时，系统会调用此方法以通知当前视图
     *
     * @param {ParamChangeEvent} event 参数改变事件
     * @returns {void}
     */
    exports.onParamChange = function(event) {
        console.log(event);
    };
});