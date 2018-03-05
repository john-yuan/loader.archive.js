/**
 * 路由器模块
 *
 * @author John Yuan
 * @module loader/core/router
 * @version 1.0.0
 */
define(function(require, exports, module) {
    var hooks = require('runtime/hooks');
    var utils = require('loader/utils/utils');
    var urlParams = require('loader/utils/urlParams');
    var location = window.location;
    var mRoute = null;
    var mHashPrefix = '';
    var mExtraData = {};
    var mCurrentHash = null;
    var mRouterLocked = false;
    var mExpirationId = 0;
    var mInterceptors = {};

    /**
     * 获取格式化后的 hash 字符串
     *
     * @returns {String}
     */
    var getNormalizedHash = function() {
        return location.hash.replace(/^#?\/*/, '');
    };

    /**
     * 回滚路由
     */
    var rollback = function() {
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            mCurrentHash && utils.warn('回滚路由。hash=' + mCurrentHash);
        }
        mCurrentHash && (location.hash = mCurrentHash);

    };

    /**
     * 从 hash 中获取当前视图名称
     *
     * @returns {String}
     */
    var getViewName = function() {
        var hash = getNormalizedHash();
        var index = hash.indexOf('?');
        return index > -1 ? hash.substr(0, index) : hash;
    };

    /**
     * 从 hash 中获取当前视图参数
     */
    var getViewParams = function() {
        var index = location.hash.indexOf('?');
        var queryString = index > -1 ? location.hash.substr(index + 1) : '';
        return urlParams.decode(queryString);
    };

    /**
     * 锁定路由器
     */
    var lock = function() {
        mRouterLocked = true;
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            utils.warn('路由器已锁定！');
        }
    };

    /**
     * 解锁路由器
     */
    var unlock = function() {
        mRouterLocked = false;
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            utils.warn('路由器已解锁！');
        }
    };

    /**
     * 注册路由回调
     *
     * @param {Function} callback 路由回调
     */
    var onRoute = function(callback) {
        if (mRoute === null) {
            mRoute = callback;
            if (/\/$/.test(location.pathname + location.search)) {
                mHashPrefix = '#/';
            } else {
                mHashPrefix = '#';
            }
            window.addEventListener('hashchange', onHashChange);
        }
    };

    /**
     * 路由到指定视图
     *
     * @param {String} [viewName] 视图名称，如果为空则跳转至默认视图
     * @param {Object} [viewParams] 视图参数
     * @param {Object} [extraData] 附加数据
     */
    var routeTo = function(viewName, viewParams, extraData) {
        var view, hash;
        // 如果当前视图为空，则跳转至默认视图
        if (!viewName) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.info('当前视图为空，跳转至默认视图！');
            }
            view = hooks.getDefaultView();
            viewName = view.viewName;
            viewParams = view.viewParams;
            extraData = view.extraData;
        }
        // 检查参数是否正确
        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            if (viewParams && utils.type(viewParams) !== 'object') {
                throw new TypeError('viewParams 必须是一个 object！');
            }
            if (extraData && utils.type(extraData) !== 'object') {
                throw new TypeError('extraData 必须是一个 object！');
            }
        }

        hash = mHashPrefix + viewName;

        // 判断是否有参数
        if (viewParams) {
            viewParams = urlParams.encode(viewParams);
            hash = viewParams ? (hash + '?' + viewParams) : hash;
        }

        // 保存附加数据
        mExtraData = {};
        mExtraData[viewName] = extraData;
        // 如果 hash 等于 location.hash 则手动触发 onHashChange 事件
        if (hash === location.hash || (hash === '#' && location.hash === '')) {
            onHashChange();
        } else {
            location.hash = hash;
        }
    };

    /**
     * 监听浏览器 hashchange 事件
     */
    var onHashChange = function() {
        var hash = getNormalizedHash();
        var viewName = getViewName();
        var viewParams = getViewParams();
        var extraData = mExtraData[viewName] || {};

        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            utils.info('检测到 hash 变化。hash=' + hash);
        }

        // 重置附加数据
        mExtraData = {};

        // 如果 hash 为空，则跳转至默认视图
        if (hash === '') {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.info('hash 为空，跳转至默认视图。');
            }
            routeTo();
        // 检查视图是否改变
        } else if (hash === mCurrentHash) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.warn('目标 hash 与当前 hash 一样，本次路由无效。');
            }
        // 检查路由是否被锁定
        } else if (mRouterLocked) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.warn('当前路由已被锁定！');
            }
            if (hooks.shouldUnlockRouter(viewName, viewParams, extraData, mCurrentHash || '')) {
                unlock();
                route(hash, viewName, viewParams, extraData);
            } else {
                utils.warn('本次跳转已被拦截！');
                // 跳回去
                rollback();
            }
        } else {
            route(hash, viewName, viewParams, extraData);
        }
    };

    /**
     * 执行路由
     *
     * @param {String} hash 目标 hash 值
     * @param {String} viewName 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     */
    var route = function(hash, viewName, viewParams, extraData) {
        intercept('*', hash, viewName, viewParams, extraData, function() {
            intercept(viewName, hash, viewName, viewParams, extraData, function() {
                mCurrentHash = hash;
                mRoute(viewName, viewParams, extraData);
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    utils.info('路由已完成!');
                }
            });
        });
    };

    /**
     * 执行拦截器
     *
     * @param {String} name 拦截器名称
     * @param {String} hash 目标 hash 值
     * @param {String} viewName 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     * @param {Function} pass 通过回调
     */
    var intercept = function(name, hash, viewName, viewParams, extraData, pass) {
        var expirationId = mExpirationId = mExpirationId + 1;
        var savedInterceptor = mInterceptors[name], interceptorBack;

        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
            utils.info('检查拦截器 ' + name + ' 是否存在。');
        }
        // 检查拦截器是否存在
        if (savedInterceptor) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.warn('拦截器 ' + name + ' 已注册，正在执行该拦截器。');
            }
            interceptorBack = savedInterceptor(viewName, viewParams, extraData);
            // 检查拦截器返回值
            if (interceptorBack === true) {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    utils.warn('拦截器 ' + name + ' 同步返回，不进行拦截，继续往下执行。');
                }
                pass();
            } else if (utils.type(interceptorBack) === 'function') {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    utils.warn('拦截器 ' + name + ' 返回异步函数，正执行该函数并等待回调。');
                }
                interceptorBack(function(next) {
                    if (expirationId === mExpirationId) {
                        if (next) {
                            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                                utils.warn('拦截器 ' + name + ' 异步回调完成，不进行拦截，继续往下执行。');
                            }
                            pass();
                        } else {
                            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                                utils.warn('拦截器 ' + name + ' 异步回调完成，已拦截本次路由。');
                            }
                            rollback();
                        }
                    } else {
                        if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                            utils.error('拦截器 ' + name + ' 异步回调已失效。hash=' + hash);
                        }
                    }
                });
            } else {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    utils.warn('拦截器 ' + name + ' 同步返回，已拦截本次路由。');
                }
                rollback();
            }
        } else {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.info('拦截器 ' + name + ' 不存在，继续往下执行。');
            }
            pass();
        }
    };

    /**
     * 设置、获取或删除视图拦截器
     *
     * 拦截器处理函数的返回值决定了是否拦截，对拦截器返回值的处理如下：
     *
     * 1. 同步拦截：当返回值为 true 时不进行拦截
     * 2. 异步拦截：当返回值为一个函数时，则立即执行该函数并传入一个回调函数，并等待回调函数被执行
     * 3. 其它任何返回值都会进行拦截
     *
     * 拦截器的具体执行过程 @see router.route
     *
     * @param {String} viewName 拦截的视图名称（当视图名称为 * 时，表示拦截所有视图）
     * @param {Function|Falsy} [handler] 当 handler 为 Falsy 删除指定拦截器，当为一个函数时设置指定拦截器
     * @returns {Function|undefined} 当且仅当传入的参数个数为 1 时，返回对应的处理函数（如果存在）
     * @example router.interceptor('home', function a() {}); 为 home 添加拦截器 a
     * @example router.interceptor('home', function b() {}); 将 home 的拦截器替换为 b
     * @example router.interceptor('home', null); 删除 home 的拦截器
     * @example router.interceptor('home'); 获取 home 的拦截器
     */
    var interceptor = function(viewName, handler) {
        if (arguments.length === 1) {
            return mInterceptors[viewName];
        } else if (arguments.length === 2) {
            if (handler) {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    if (utils.type(handler) === 'function') {
                        if (mInterceptors[viewName]) {
                            if (mInterceptors[viewName] === handler) {
                                utils.info('视图拦截器 ' + viewName + ' 未改变！');
                            } else {
                                utils.info('视图拦截器 ' + viewName + ' 已改变！');
                            }
                        } else {
                            utils.info('视图拦截器 ' + viewName + ' 已添加！');
                        }
                    } else {
                        throw new TypeError('视图拦截器 ' + viewName + ' 必须是一个函数！');
                    }
                }
                mInterceptors[viewName] = handler;
            } else {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    if (mInterceptors[viewName]) {
                        utils.info('视图拦截器 ' + viewName + ' 已删除！');
                    } else {
                        utils.warn('视图拦截器 ' + viewName + ' 不存在！');
                    }
                }
                delete mInterceptors[viewName];
            }
        } else {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                throw new Error('拦截器参数错误，参数列表为 (viewName, [handler])。')
            }
        }
    };

    exports.lock = lock;
    exports.unlock = unlock;
    exports.onRoute = onRoute;
    exports.routeTo = routeTo;
    exports.interceptor = interceptor;
    exports.getViewName = getViewName;
    exports.getViewParams = getViewParams;
});