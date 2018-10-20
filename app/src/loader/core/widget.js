/**
 * 组件管理器
 *
 * @author John Yuan
 * @module loader/core/widget
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var dom = require('loader/utils/dom');
    var hooks = require('runtime/hooks');
    var document = window.document;
    var mHeadElement = document.getElementsByTagName('head')[0];
    var mWidgetContainer;

    /**
     * 获取组件容器节点
     *
     * @returns {Element}
     */
    var getWidgetContainer = function () {
        if (!mWidgetContainer) {
            mWidgetContainer = hooks.getWidgetContainer();
            if (!mWidgetContainer || mWidgetContainer.nodeType !== 1) {
                mWidgetContainer = document.body;
            }
        }
        return mWidgetContainer;
    };

    /**
     * 获取组件 id
     *
     * @param {Object} widgetModule
     * @returns {String}
     */
    var getId = function (widgetModule) {
        return 'w-' + widgetModule.id.split(/\/+/).slice(1, -1).join('-');
    };

    /**
     * 添加组件
     *
     * @param {Object} widgetModule
     * @param {String|null} cssText
     * @param {String|null} htmlText
     * @returns {Element|undefined} 如果指定了 htmlText 则返回根节点，否则返回 undefined
     */
    var append = function (widgetModule, cssText, htmlText) {
        var id = getId(widgetModule), lastStyleNode, styleNode, rootNode;
        if (cssText) {
            styleNode = dom.createStyleNode(cssText, 'style-' + id, 'style-widget');

            lastStyleNode = mHeadElement.getElementsByClassName('style-widget');

            if (lastStyleNode && lastStyleNode.length) {
                lastStyleNode = lastStyleNode[lastStyleNode.length - 1];
            } else {
                lastStyleNode = document.getElementById('style-base');
            }

            if (lastStyleNode && lastStyleNode.nextSibling) {
                mHeadElement.insertBefore(styleNode, lastStyleNode.nextSibling);
            } else {
                mHeadElement.appendChild(styleNode);
            }
        }
        if (htmlText) {
            rootNode = dom.createDOM(htmlText);
            hooks.onCreateWidgetRootNode(rootNode, widgetModule);
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                if (rootNode.id) {
                    throw new Error('禁止为组件模板根节点指定 ID，请检查！\n' + htmlText);
                }
            }
            rootNode.id = id;
            return getWidgetContainer().appendChild(rootNode);
        }
    };

    /**
     * 移除组件
     *
     * @param {Object} widgetModule
     */
    var remove = function (widgetModule) {
        var id = getId(widgetModule), styleNode, rootNode;
        styleNode = document.getElementById('style-' + id);
        rootNode = document.getElementById(id);
        rootNode && getWidgetContainer().removeChild(rootNode);
        styleNode && mHeadElement.removeChild(styleNode);
    };

    exports.append = append;
    exports.remove = remove;
});