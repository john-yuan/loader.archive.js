/**
 * DOM 处理模块
 *
 * @author John Yuan
 * @module loader/utils/dom
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var utils = require('loader/utils/utils');
    var document = window.document;

    /**
     * 创建 <style> 标签
     *
     * 注意：此函数仅在开发环境下对 less 进行编译，打包工具应该对 less 进行预编译
     *
     * @param {String} cssText css 或 less 文本
     * @param {String} [styleId] <style> 标签的 ID
     * @param {String} [styleClassName] <style> 标签的 className
     * @returns {<style>}
     */
    var createStyleNode = function (cssText, styleId, styleClassName) {
        var styleNode = document.createElement('style');

        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            (function () {
                var start = Date.now(), timeUsed;
                var less = require('loader/deps/less');
                var mixin = require('loader/plugin/text!runtime/mixin.less');
                // 处理 less
                less.render(mixin + '\n' + cssText, function (err, res) {
                    if (err) {
                        utils.error('处理 less 脚本失败!');
                        throw err;
                    } else {
                        cssText = '\n' + res.css;
                    }
                });
                timeUsed = (Date.now() - start);
                // 超过 100 毫秒打印提示信息
                if (timeUsed >= 100) {
                    utils.warn('处理 less 脚本耗时 ' + timeUsed + 'ms');
                }
            })();
        }

        styleId && (styleNode.id = styleId);
        styleClassName && (styleNode.className = styleClassName);
        styleNode.setAttribute('type', 'text/css');

        if (styleNode.styleSheet) {
            styleNode.styleSheet.cssText = cssText;
        } else {
            styleNode.appendChild(document.createTextNode(cssText));
        }

        return styleNode;
    };

    /**
     * 根据 html 文本创建 DOM 结构
     *
     * @param {String} htmlText
     * @returns {Element}
     */
    var createDOM = function (htmlText) {
        var childNodes, length, div = document.createElement('div');
        // 插入html
        div.innerHTML = htmlText;
        // 获取子节点
        childNodes = div.childNodes;
        length = childNodes.length;
        // 只有在开发环境才抛出错误
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            return (function () {
                // 找出所有元素节点
                var nodes = [];
                while(length--) {
                    if (childNodes[length].nodeType === 1) {
                        nodes.push(childNodes[length]);
                    }
                }
                // 如果不止一个根节点则抛出错误
                if (nodes.length !== 1) {
                    throw new Error(
                        '视图模板只能包含一个根节点, 但给定的 HTML 文本中包含'
                        + nodes.length + '个根节点。\n' + htmlText
                    );
                }
                // 返回根节点
                return nodes[0];
            })();
        } else {
            while(length--) {
                if (childNodes[length].nodeType === 1) {
                    return childNodes[length];
                }
            }
        }
    };

    /**
     * 检查 node 的 className 中是否包含 name
     *
     * @param {Element} node
     * @param {String} name
     * @returns {Boolean} 有则返回 true, 否则返回 false
     */
    var hasClass = function (node, name) {
        var classNames, i, length;
        if (node.className && name) {
            classNames = node.className.split(/\s+/);
            length = classNames.length;
            for (i = 0; i < length; i += 1) {
                if (classNames[i] === name) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * 在 node 的 className 中添加 name
     *
     * @param {Element} node
     * @param {String} name
     */
    var addClass = function (node, name) {
        if (!hasClass(node, name)) {
            node.className = node.className ? (node.className + ' ' + name) : name;
        }
    };

    /**
     * 在 node 的 className 中移除 name
     *
     * @param {Element} node
     * @param {String} name
     */
    var removeClass = function (node, name) {
        var classNames, newClassNames, i, length;
        if (node.className && name) {
            classNames = node.className.split(/\s+/);
            length = classNames.length;
            newClassNames = [];
            for (i = 0; i < length; i += 1) {
                if (classNames[i] !== name) {
                    newClassNames.push(classNames[i]);
                }
            }
            node.className = newClassNames.join(' ');
        }
    };

    exports.createStyleNode = createStyleNode;
    exports.createDOM = createDOM;
    exports.addClass = addClass;
    exports.hasClass = hasClass;
    exports.removeClass = removeClass;
});