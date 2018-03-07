/**
 * 系统钩子模块
 *
 * @module runtime/hooks
 * @version 1.0.0
 */
define(function(require, exports, module) {
    /**
     * 获取配置信息
     *
     * @returns {Object}
     */
    exports.getSettings = function() {
        return {
            /**
             * 系统日志级别
             * 0    关闭系统日志
             * 1    只打印错误日志
             * 2    只打印错误和警告日志
             * 3    打印全部日志
             */
            logLevel: 3
        };
    };

    /**
     * 获取基础样式
     *
     * @returns {String}
     */
    exports.getBaseCssText = function() {
        return [
            require('loader/deps/text!assets/styles/base.less'),
        ].join('\n');
    };

    /**
     * 初始化操作
     *
     * @param {Function} done
     */
    exports.init = function(done) {
        done();
    };

    /**
     * 获取默认视图信息
     *
     * @returns {Object}
     */
    exports.getDefaultView = function() {
        return {
            viewName: 'home',
            viewParams: null,
            extraData: null
        };
    };

    /**
     * 是否应该解锁路由
     *
     * @param {String} viewName 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     * @param {String} lockedHash 锁定的 hash
     * @returns {Boolean} 返回 true 解锁，否则不解锁
     */
    exports.shouldUnlockRouter = function(viewName, viewParams, extraData, lockedHash) {
        return false;
    };

    /**
     * 视图加载失败回调
     *
     * @param {Boolean} expired 渲染会话是否过期
     * @param {String} viewName 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     */
    exports.onLoadViewError = function(expired, viewName, viewParams, extraData) {

    };

    /**
     * 视图加载前调用
     *
     * @param {String} viewName 视图名称
     */
    exports.beforeLoadingView = function(viewName) {

    };

    /**
     * 视图加载完成后调用
     *
     * @param {String} viewName 视图名称
     */
    exports.afterLoadingView = function(viewName) {

    };


    /**
     * 视图参数改变前调用
     *
     * @param {ParamChangeEvent} event 视图参数改变事件对象
     */
    exports.beforeViewParamChange = function(event) {

    };

    /**
     * 视图参数改变后调用
     *
     * @param {ParamChangeEvent} event 视图参数改变事件对象
     */
    exports.afterViewParamChange = function(event) {

    };

    /**
     * 视图销毁之前调用
     *
     * @param {DestroyEvent} event 视图销毁事件对象
     */
    exports.beforeDestroyView = function(event) {

    };

    /**
     * 视图销毁之后调用
     *
     * @param {DestroyEvent} event 视图销毁事件对象
     */
    exports.afterDestroyView = function(event) {

    };

    /**
     * 视图渲染前调用
     *
     * @param {RenderEvent} event 视图渲染事件对象
     */
    exports.beforeRenderView = function(event) {

    };

    /**
     * 视图渲染后调用
     *
     * @param {RenderEvent} event 视图渲染事件对象
     */
    exports.afterRenderView = function(event) {

    };

    /**
     * 获取视图容器
     *
     * @returns {HTMLElement|Void} 如果不返回则默认使用 document.body
     */
    exports.getViewContainer = function() {

    };

    /**
     * 获取组件容器
     *
     * @returns {HTMLElement|Void} 如果不返回则默认使用 document.body
     */
    exports.getWidgetContainer = function() {

    };
});
