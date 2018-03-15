/**
 * 调度器模块
 *
 * @author John Yuan
 * @module loader/core/dispatcher
 * @version 1.0.0
 */
define(function (require, exports, module) {
    var dom = require('loader/utils/dom');
    var hooks = require('runtime/hooks');
    var utils = require('loader/utils/utils');
    var router = require('loader/core/router');
    var Callbacks = require('loader/utils/Callbacks');
    var domReady = require('loader/deps/domReady');
    var requirejs = window.requirejs;
    var document = window.document;
    var mLaunched = false;
    var mDispatchId = 0;
    var mLoadedViews = {};
    var mLoadingViewName = null;
    var mCurrentView = { exports: {}, renderCount: 0 };
    var mCurrentViewParams = {};
    var mOnceBeforeDestroyViewCbs = null;
    var mOnBeforeDestroyViewCbs = null;
    var mOnceViewDestroyedCbs = null;
    var mOnViewDestroyedCbs = null;

    /**
     * 视图渲染事件
     *
     * @class
     * @param {Object} targetView
     * @param {Object} prevView
     * @param {Object} viewParams
     * @param {Object} extraData
     */
    var RenderEvent = function (targetView, prevView, viewParams, extraData) {
        this.targetView = targetView;
        this.prevView = prevView;
        this.viewParams = viewParams;
        this.extraData = extraData;
        this.session = {};
    };

    /**
     * 视图销毁事件
     *
     * @class
     * @param {Object} targetView
     * @param {Object} nextView
     */
    var DestroyEvent = function (targetView, nextView) {
        this.targetView = targetView;
        this.nextView = nextView;
        this.session = {};
    };

    /**
     * 参数改变事件
     *
     * @class
     * @param {Object} targetView
     * @param {Object} viewParams
     * @param {Object} prevParams
     */
    var ParamChangeEvent = function (targetView, viewParams, prevParams) {
        this.targetView = targetView;
        this.viewParams = viewParams;
        this.prevParams = prevParams;
        this.session = {};
    };

    /**
     * 结束加载视图
     */
    var endLoadingView = function () {
        if (mLoadingViewName) {
            hooks.afterLoadingView(mLoadingViewName);
            mLoadingViewName = null;
        }
    };

    /**
     * 开始加载视图
     *
     * @param {String} viewName 视图名称
     */
    var startLoadingView = function (viewName) {
        mLoadingViewName = viewName;
        hooks.beforeLoadingView(viewName);
    };

    /**
     * 调度视图
     *
     * @param {String} viewName 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     */
    var dispatch = function (viewName, viewParams, extraData) {
        var dispatchId = (mDispatchId = mDispatchId + 1);
        var targetView = mLoadedViews[viewName];

        endLoadingView();

        if (targetView) {
            renderView(targetView, viewParams, extraData);
        } else {
            startLoadingView(viewName);
            loadView(viewName, function (targetView) {
                if (mDispatchId === dispatchId) {
                    renderView(targetView, viewParams, extraData);
                } else {
                    if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                        utils.info('视图 ' + viewName + ' 加载完成，但是渲染会话过期。');
                    }
                }
            }, function () {
                if (dispatchId === mDispatchId) {
                    if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                        utils.error('加载视图 ' + viewName + ' 失败。');
                    }
                    endLoadingView();
                    hooks.onLoadViewError(false, viewName, viewParams, extraData);
                } else {
                    if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                        utils.error('加载视图 ' + viewName + ' 失败，且渲染会话过期。');
                    }
                    hooks.onLoadViewError(true, viewName, viewParams, extraData);
                }
            });
        }
    };

    /**
     * 根据视图名称加载视图
     *
     * @param {String} viewName 视图名称
     * @param {Function} onSuccess 加载成功回调
     * @param {Function} onError 加载失败回调
     */
    var loadView = function (viewName, onSuccess, onError) {
        var id = ['views', viewName, viewName.replace(/[\s\S]+\//, '')].join('/');
        // 异步加载视图
        requirejs([id], function (exports) {
            var view = { viewName: viewName, exports: exports, renderCount: 0 };
            // 保存视图
            mLoadedViews[viewName] = view;
            // 执行回调
            onSuccess(view);
        }, function (err) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.error(err.stack);
            }
            onError();
        });
    };

    /**
     * 销毁当前视图并渲染目标视图
     *
     * @param {String} targetView 视图名称
     * @param {Object} viewParams 视图参数
     * @param {Object} extraData 附加数据
     */
    var renderView = function (targetView, viewParams, extraData) {
        var renderEvent, destroyEvent, paramChangeEvent;

        if (targetView === mCurrentView) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.info('视图参数改变 ' + targetView.viewName + '。');
            }
            // 创建参数改变事件对象
            paramChangeEvent = new ParamChangeEvent(targetView, viewParams, mCurrentViewParams);
            // 调用钩子
            hooks.beforeViewParamChange(paramChangeEvent);
            // 通知参数改变
            if (targetView.exports.onParamChange) {
                targetView.exports.onParamChange(paramChangeEvent);
            }
            // 调用钩子
            hooks.afterViewParamChange(paramChangeEvent);
            // 保存最新参数
            mCurrentViewParams = viewParams;
        } else {
            // 销毁上一个视图
            if ('viewName' in mCurrentView) {
                if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                    utils.info('销毁视图 ' + mCurrentView.viewName + '。');
                }
                // 创建视图销毁事件对象
                destroyEvent = new DestroyEvent(mCurrentView, targetView);
                // 调用视图销毁前钩子
                hooks.beforeDestroyView(destroyEvent);
                // 执行视图销毁前单次回调
                mOnceBeforeDestroyViewCbs.apply(null, [destroyEvent]).clear();
                // 执行视图销毁前回调
                mOnBeforeDestroyViewCbs.apply(null, [destroyEvent]);
                // 调用视图销毁函数
                if (mCurrentView.exports.destroy) {
                    mCurrentView.exports.destroy(destroyEvent);
                }
                // 执行视图销毁后单次回调
                mOnceViewDestroyedCbs.apply(null, [destroyEvent]).clear();
                // 执行视图销毁后回调
                mOnViewDestroyedCbs.apply(null, [destroyEvent]);
                // 调用视图销毁钩子
                hooks.afterDestroyView(destroyEvent);
            }
            // 重置滚动条高度
            document.body.scrollTop = document.documentElement.scrollTop = 0;
            // 渲染目标视图
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.info('渲染视图 ' + targetView.viewName + '。');
            }
            // 创建视图渲染事件对象
            renderEvent = new RenderEvent(targetView, mCurrentView, viewParams, extraData);
            // 调用钩子
            hooks.beforeRenderView(renderEvent);
            if (targetView.exports.render) {
                targetView.renderCount += 1;
                targetView.exports.render(renderEvent);
            }
            // 调用钩子
            hooks.afterRenderView(renderEvent);
            // 保存当前视图信息
            mCurrentView = targetView;
            mCurrentViewParams = viewParams;
        }
    };

    /**
     * 注册视图销毁前回调（只执行一次）
     *
     * @param {Function} callback
     */
    var onceBeforeDestroyView = function (callback) {
        mOnceBeforeDestroyViewCbs.add(callback);
    };

    /**
     * 注册视图销毁前回调
     *
     * @param {Function} callback
     */
    var onBeforeDestroyView = function (callback) {
        mOnBeforeDestroyViewCbs.add(callback);
    };

    /**
     * 注册视图销毁完成后回调（只执行一次）
     *
     * @param {Function} callback
     */
    var onceViewDestroyed = function () {
        mOnceViewDestroyedCbs.add(callback);
    };

    /**
     * 注册视图销毁完成后回调
     *
     * @param {Function} callback
     */
    var onViewDestroyed = function (callback) {
        mOnViewDestroyedCbs.add(callback);
    };

    /**
     * 初始化
     */
    var initialize = function () {
        mOnceBeforeDestroyViewCbs = new Callbacks();
        mOnceBeforeDestroyViewCbs.onError(function (err) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.error('执行 onceBeforeDestroyView 回调失败!');
                console.error(err.stack);
            }
        });

        mOnBeforeDestroyViewCbs = new Callbacks();
        mOnBeforeDestroyViewCbs.onError(function (err) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.error('执行 onBeforeDestroyView 回调失败!');
                console.error(err.stack);
            }
        });

        mOnceViewDestroyedCbs = new Callbacks();
        mOnceViewDestroyedCbs.onError(function (err) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.error('执行 onceViewDestroyed 回调失败!');
                console.error(err.stack);
            }
        });

        mOnViewDestroyedCbs = new Callbacks();
        mOnViewDestroyedCbs.onError(function (err) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                utils.error('执行 onViewDestroyed 回调失败!');
                console.error(err.stack);
            }
        });
    };

    /**
     * 执行路由器
     */
    var launch = function () {
        if (mLaunched === false) {
            mLaunched = true;
            initialize();
            domReady(function () {
                var baseStyleNode = dom.createStyleNode(hooks.getBaseCssText() || '', 'style-base');
                // 注入基础样式
                if (document.head.firstChild) {
                    document.head.insertBefore(baseStyleNode, document.head.firstChild);
                } else {
                    document.head.appendChild(baseStyleNode);
                }
                // 注册路由回调
                router.onRoute(dispatch);
                // 初始化并渲染第一个视图
                hooks.init(function () {
                    router.routeTo(router.getViewName(), router.getViewParams());
                });
            });
        }
    };

    exports.launch = launch;
    exports.onceBeforeDestroyView = onceBeforeDestroyView;
    exports.onBeforeDestroyView = onBeforeDestroyView;
    exports.onceViewDestroyed = onceViewDestroyed;
    exports.onViewDestroyed = onViewDestroyed;
});