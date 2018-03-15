/**
 * 回调函数
 *
 * @author John Yuan
 * @module loader/utils/Callbacks
 * @version 1.0.0
 */
define(function (require, exports, module) {
    /**
     * @class Callbacks
     */
    var Callbacks = function () {
        this.handler = null;
        this.callbacks = [];
    };

    /**
     * 获取当前回调函数个数
     *
     * @returns {Number}
     */
    Callbacks.prototype.size = function () {
        return this.callbacks.length;
    };

    /**
     * 添加回调函数
     *
     * @param {Function} callback 回调函数
     * @returns {this} 返回当前实例
     * @throws {TypeError}
     */
    Callbacks.prototype.add = function (callback) {
        if ({}.toString.call(callback) === '[object Function]') {
            this.callbacks.push(callback);
        } else {
            throw new TypeError('callback must be a function.');
        }

        return this;
    };

    /**
     * 移除回调函数
     *
     * @param {Function} callback 回调函数
     * @returns {this} 返回当前实例
     */
    Callbacks.prototype.remove = function (callback) {
        var index = this.callbacks.indexOf(callback);

        while (index > -1) {
            this.callbacks.splice(index, 1);
            index = this.callbacks.indexOf(callback);
        }

        return this;
    };

    /**
     * 清空回调函数列表
     *
     * @returns {this} 返回当前实例
     */
    Callbacks.prototype.clear = function () {
        this.callbacks = [];

        return this;
    };

    /**
     * 执行回调队列中的函数
     *
     * @param {Any} context 上下文
     * @param {...Any} [args] 参数列表
     * @returns {this} 返回当前实例
     */
    Callbacks.prototype.call = function (context /* , ...args */) {
        return this.apply(context, [].slice.call(arguments, 1));
    };

    /**
     * 执行回调队列中的函数
     *
     * @param {Any} context 上下文
     * @param {Array} [args] 参数列表
     * @returns {this} 返回当前实例
     * @throws {Error} 执行回调时回调函数抛出的异常
     */
    Callbacks.prototype.apply = function (context, args) {
        var i = 0, l = this.callbacks.length;

        for ( ; i < l; i += 1) {
            try {
                this.callbacks[i].apply(context, args);
            } catch(err) {
                if (this.handler) {
                    this.handler(err, this.callbacks[i], i);
                } else {
                    throw err;
                }
            }
        }

        return this;
    };

    /**
     * 设置错误处理函数
     *
     * @param {Function} handler 错误处理函数
     * @returns {this} 返回当前实例
     * @throws {TypeError}
     */
    Callbacks.prototype.onError = function (handler) {
        if ({}.toString.call(handler) === '[object Function]') {
            this.handler = handler;
        } else {
            throw new TypeError('handler must be a function.');
        }

        return this;
    };

    module.exports = Callbacks;
});