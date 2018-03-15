# RS

本项目是一个基于 [require.js][rjs] 的单页面应用程序加载引擎。它具有以下特点：

* 零配置的动态路由；
* 定义良好的视图接口；
* 丰富的系统内置钩子；
* 根据视图按需加载所需资源；
* 基于 [AMD][amd] 规范进行模块化；
* 内置 [LESS][less] 支持，并在打包时进行预编译；
* 内置 [EJS][ejs] 模板引擎支持，并在打包时进行预编译；
* 打包时自动处理样式脚本（添加浏览器前缀，图片转换为 DataURI，压缩等）；
* 打包时自动添加脚本 hash 值后缀，并修改文件最后修改时间以支持增量升级；

[rjs]: https://github.com/requirejs/requirejs "require.js"
[amd]: https://github.com/amdjs/amdjs-api/blob/master/AMD.md "AMD"
[less]: https://github.com/less/less.js "less.js"
[ejs]: http://ejs.co/ "ejs.co"

## 目录结构

```plaintext
rs
├─app                      # 前端资源目录
│  ├─src                   # 资源目录（AMD模块根目录）
│  │  ├─assets             # 静态资源目录
│  │  ├─libs               # 第三方库目录
│  │  │  ├─zepto.js        # zepto.js（非必须）
│  │  │  └─...             # 其它第三方库
│  │  ├─loader             # 加载器目录
│  │  │  ├─loader.js       # 加载器入口模块
│  │  │  └─...             # 其它加载器依赖文件（用户可不必关心）
│  │  ├─runtime            # 运行时目录
│  │  │  ├─hooks.js        # 系统钩子模块，可在此进行系统配置等
│  │  │  └─mixin.less      # less脚本mixin文件
│  │  ├─views              # 视图目录
│  │  │  ├─demo            # demo视图目录（演示）
│  │  │  │  ├─demo.js      # demo视图入口文件
│  │  │  │  ├─demo.less    # demo视图样式文件
│  │  │  │  └─demo.tpl     # demo视图HTML文件
│  │  │  └─...             # 其它视图目录
│  │  └─widgets            # 组件目录
│  └─index.html            # 入口文件（可更改）
├─dev-tools                # 开发工具目录
└─build.config.json        # 打包配置文件
```

## 相关命令

以下命令均可使用 [cnpm](https://npm.taobao.org/ "淘宝 NPM 镜像") 进行替换。

```bash
# 安装依赖
npm install

# 启动服务器，默认地址为 http://127.0.0.1:8080/
npm start

# 启动服务器，指定端口为 4003
npm start 4003

# 启动服务器，指定端口为 4003，指定根目录为 app
npm start 4003 app

# 打包项目
npm run build

# 打包项目，并指定配置文件
npm run build build.config.json
```

**内置的服务器只是为了开发时调试方便，用户可以将 app 目录部署至任意服务器。**

## 定义视图

所有的视图都放置于 `src/views` 目录下，并以视图的入口文件名作为目录名，在此目录下存放视图所需资源。

例如我们要创建一个名为 `test` 的视图，需创建以下三个文件：

```plaintext
views/test/test.js      视图test的入口文件
views/test/test.less    视图test的样式文件
views/test/test.tpl     视图test的HTML文件
```

并在视图文件的入口文件 `views/test/test.js` 中实现视图的接口，具体见以下代码：

```javascript
/**
 * test 视图模块
 */
define(function (require, exports, module) {
    // 引入加载器模块
    var loader = require('loader/loader');

    /**
     * 渲染视图接口
     *
     * 当需要渲染此视图时，系统会调用此方法以渲染视图
     *
     * @param {RenderEvent} event 渲染事件对象
     * @returns {void}
     */
    exports.render = function (event) {
        // 引入视图样式文件
        var cssText = require('loader/deps/text!./test.less');
        // 引入视图HTML文件
        var htmlText = require('loader/deps/text!./test.tpl');
        // 调用 loader.view.render API 渲染视图，并获取视图根元素
        var rootElement = loader.view.render(module, cssText, htmlText);

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
    exports.destroy = function (event) {
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
    exports.onParamChange = function (event) {
        console.log(event);
    };
});
```

编写视图HTML文件 `views/test/test.tpl`：

```html
<!-- 每个视图只能有一个根节点 -->
<div>
    <div class="greeting">Hello :)</div>
</div>
```

编写视图的样式文件 `views/test/test.less`：

```less
// 系统会为每个视图自动添加唯一的命名空间，多个视图间的选择器不会相互影响
// 可以打开 Chrome 调试工具查看最终生成代码

// 定义此视图下全局样式
&-global {
    // 当显示此视图是设置网页背景色为 #f1f1f1
    body {
        background: #f1f1f1;
    }
}

.greeting {
    font-size: 1.5rem;
}
```

执行以下代码启动服务器并访问 http://127.0.0.1:8080/#/test 查看结果。

```bash
# 启动本地服务器，默认端口为 8080
npm start
```

## 路由规则

系统会根据 hash 的改变自动的进行视图的加载，所以我们无需进行路由的配置，具体映射规则如下：

```
#/login           对应文件为: views/login/login.js
#/user/following  对应文件为: views/user/following/following.js
#/user/followers  对应文件为: views/user/followers/followers.js
```

## 视图参数

我们可以在视图路由 hash 后面加上查询字符串（querystring）以向视图传递参数，如下：

```
#/test?name=john-yuan&followers=10 向视图 test 传递参数
```

## 其它接口

系统钩子函数说明请查看 [runtime/hooks.js](app/src/runtime/hooks.js "系统钩子文件")

[dispatcher 模块](app/src/loader/core/dispatcher.js "dispatcher")的接口主要用于注册视图销毁事件回调，通常用于组件在视图被销毁后执行释放操作，接口说明如下：

```javascript
var loader = require('loader/loader');

/**
 * 注册视图销毁回调，在每个视图被销毁后执行
 *
 * @param {Function} callback 回调函数，参数为 destroyEvent
 */
loader.dispatcher.onViewDestroyed(callback);

/**
 * 注册视图销毁回调，在每个视图被销毁后执行，只执行一次便被移除
 *
 * @param {Function} callback 回调函数，参数为 destroyEvent
 */

loader.dispatcher.onceViewDestroyed(callback);
/**
 * 注册视图销毁回调，在每个视图被销毁前执行
 *
 * @param {Function} callback 回调函数，参数为 destroyEvent
 */
loader.dispatcher.onBeforeDestroyView(callback);

/**
 * 注册视图销毁回调，在每个视图被销毁前执行，只执行一次便被移除
 *
 * @param {Function} callback 回调函数，参数为 destroyEvent
 */
loader.dispatcher.onceBeforeDestroyView(callback);
```

[router 模块](app/src/loader/core/router.js "router")主要提供路由操作相关函数，其说明如下：

```javascript
var loader = require('loader/loader');

/**
 * 锁定当前路由
 */
loader.router.lock();

/**
 * 解锁当前路由
 */
loader.router.unlock();

/**
 * 路由到指定视图
 *
 * @param {String} viewName 视图名称
 * @param {Obejct} [viewParams] 视图参数（只能为能被 JSON 序列化的数据）
 * @param {Object} [extraData] 附加数据（任意数据类型）
 */
loader.router.routeTo(viewName, viewParams, extraData);

/**
 * 添加拦截器（详细信息请查看源码 loader/core/router.js）
 *
 * @param {String} viewName 拦截的视图名称
 * @param {Function} handler 拦截器函数
 */
loader.router.interceptor(viewName, handler);

/**
 * 获取当前视图名称
 *
 * @returns {String}
 */
loader.router.getViewName();

/**
 * 获取当前视图参数
 *
 * @returns {Object}
 */
loader.router.getViewParams();
```

[template 模块](app/src/loader/core/template.js "template")主要对 EJS 模板进行了简单的封装，方便打包工具在打包时对模板进行预编译：

```javascript
var loader = require('loader/loader');

/**
 * 编译 ejs 模板字符串
 *
 * 具体使用方法参考：views/example/template/template.js
 *
 * @param {String} templateText 模板字符串
 * @returns {Function} 编译后的函数
 */
loader.template(templateText);
```

[view 模块](app/src/loader/core/view.js "view")主要提供了与视图相关的函数：

```javascript
var loader = require('loader/loader');

/**
 * 渲染视图
 *
 * @param {Module} viewModule 视图所在AMD模块
 * @param {String|null} cssText 样式文本
 * @param {String|null} htmlText HTML文本
 * @returns {HTMLElement} 视图根节点
 */
loader.view.render(viewModule, cssText, htmlText);

/**
 * 销毁视图
 *
 * @param {Module} viewModule 视图所在AMD模块
 */
loader.view.destroy(viewModule);

/**
 * 隐藏视图
 *
 * @param {Module} viewModule 视图所在AMD模块
 */
loader.view.hide(viewModule);

/**
 * 显示视图
 *
 * @param {Module} viewModule 视图所在AMD模块
 */
loader.view.show(viewModule);

/**
 * 判断视图是否渲染
 *
 * @returns {Boolean}
 */
loader.view.isRendered(viewModule);

/**
 * 获取系统渲染视图次数
 *
 * @returns {Number}
 */
loader.view.getRenderCount();
```

[widget 模块](app/src/loader/core/view.js "widget")主要提供了与组件相关的函数：

```javascript
var loader = require('loader/loader');

/**
 * 注册组件
 *
 * @param {Module} widgetModule 组件所在AMD模块
 * @param {String|null} cssText 组件样式文本
 * @param {String|null} htmlText 组件HTML文本
 * @returns {Element|undefined} 如果指定了组件HTML文本则返回根节点，否则返回undefined
 */
loader.widget.append(widgetModule, cssText, htmlText);

/**
 * 移除组件
 *
 * @param {Object} widgetModule 组件所在AMD模块
 */
loader.widget.remove(widgetModule);
```

## License

[MIT](LICENSE "License")
