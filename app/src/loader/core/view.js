/**
 * 视图管理器
 *
 * @author John Yuan
 * @module loader/core/view
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var dom = require('loader/utils/dom');
    var hooks = require('runtime/hooks');
    var document = window.document;
    var mHtmlElement = document.getElementsByTagName('html')[0];
    var mHeadElement = document.getElementsByTagName('head')[0];
    var mViewStore = {};
    var mViewContainer, mRenderCount = 0;

    /**
     * 保存视图数据
     *
     * @param {Object} viewModule
     * @param {String} key
     * @param {Any} value
     */
    var setData = function (viewModule, key, value) {
        var store = mViewStore[viewModule.id] || {};
        store[key] = value;
        mViewStore[viewModule.id] = store;
    };

    /**
     * 获取视图数据
     *
     * @param {Object} viewModule
     * @param {String} key
     * @returns {Any}
     */
    var getData = function (viewModule, key) {
        var store = mViewStore[viewModule.id] || {};
        return store[key];
    };

    /**
     * 删除视图的所有数据
     *
     * @param {Object} viewModule
     */
    var delData = function (viewModule) {
        delete mViewStore[viewModule.id];
    };

    /**
     * 获取视图 id
     *
     * @param {Object} viewModule
     * @returns {String}
     */
    var getId = function (viewModule) {
        return 'v-' + viewModule.id.split(/\/+/).slice(1, -1).join('-');
    };

    /**
     * 获取视图容器
     *
     * @returns {Element}
     */
    var getViewContainer = function () {
        if (!mViewContainer) {
            mViewContainer = hooks.getViewContainer();
            if (!mViewContainer || mViewContainer.nodeType !== 1) {
                mViewContainer = document.body;
            }
        }
        return mViewContainer;
    };

    /**
     * 判断视图是否渲染
     *
     * @returns {Boolean}
     */
    var isRendered = function (viewModule) {
        return getData(viewModule, 'isRendered');
    };

    /**
     * 渲染视图
     *
     * @param {Object} viewModule
     * @param {String|null} cssText
     * @param {String|null} htmlText
     * @returns {Element}
     */
    var render = function (viewModule, cssText, htmlText) {
        var id = getId(viewModule), styleNode, rootNode, lastStyleNode;
        // 增加渲染计数器
        mRenderCount += 1;
        // 添加 clasName 至 html 元素
        dom.addClass(mHtmlElement, id + '-global');
        // 如果有 css 文本则创建 style 元素
        if (cssText) {
            // 开发环境添加 less 命名空间
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                cssText = [
                    '.' + id + ' {',
                        cssText,
                    '}'
                ].join('\n');
            }
            // 创建 <style> 标签
            styleNode = dom.createStyleNode(cssText, 'style-' + id, 'style-view');
            // 获取上一个 <style> 标签
            lastStyleNode = mHeadElement.getElementsByClassName('style-widget');
            if (lastStyleNode && lastStyleNode.length) {
                lastStyleNode = lastStyleNode[lastStyleNode.length - 1];
            } else {
                lastStyleNode = document.getElementById('style-base');
            }
            // 注入 <style> 标签
            if (lastStyleNode && lastStyleNode.nextSibling) {
                mHeadElement.insertBefore(styleNode, lastStyleNode.nextSibling);
            } else {
                mHeadElement.appendChild(styleNode);
            }
        }
        // 创建 DOM 结构
        rootNode = dom.createDOM(htmlText || '<div></div>');
        // 调用钩子函数处理视图根节点
        hooks.onCreateViewRootNode(rootNode, viewModule);
        // 检查是否指定了 ID
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            if (rootNode.id) {
                throw new Error('禁止为视图模板根节点指定 ID，请检查！\n' + htmlText);
            }
        }
        // 设置根节点 id 和 class
        rootNode.id = id;
        dom.addClass(rootNode, id);
        // 保存模块信息
        setData(viewModule, 'styleNode', styleNode);
        setData(viewModule, 'rootNode', rootNode);
        setData(viewModule, 'isRendered', true);
        // 添加根节点并返回该节点
        return getViewContainer().appendChild(rootNode);
    };

    /**
     * 销毁视图
     *
     * @param {Object} viewModule
     */
    var destroy = function (viewModule) {
        var rootNode = getData(viewModule, 'rootNode');
        var styleNode = getData(viewModule, 'styleNode');

        rootNode && getViewContainer().removeChild(rootNode);
        styleNode && mHeadElement.removeChild(styleNode);
        dom.removeClass(document.documentElement, getId(viewModule) + '-global');
        delData(viewModule);
    };

    /**
     * 显示视图
     *
     * @param {Object} viewModule
     */
    var show = function (viewModule) {
        var rootNode = getData(viewModule, 'rootNode');
        if (rootNode) {
            dom.addClass(document.documentElement, getId(viewModule) + '-global');
            rootNode.style.display = 'block';
        }
    };

    /**
     * 隐藏视图
     *
     * @param {Object} viewModule
     */
    var hide = function (viewModule) {
        var rootNode = getData(viewModule, 'rootNode');
        if (rootNode) {
            rootNode.style.display = 'none';
            dom.removeClass(document.documentElement, getId(viewModule) + '-global');
        }
    };

    /**
     * 获取渲染计数器
     *
     * @returns {Number} 返回 view.render 的执行次数
     */
    var getRenderCount = function () {
        return mRenderCount;
    };

    exports.getRenderCount = getRenderCount;
    exports.isRendered = isRendered;
    exports.destroy = destroy;
    exports.render = render;
    exports.show = show;
    exports.hide = hide;
});