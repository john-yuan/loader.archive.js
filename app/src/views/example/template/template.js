/**
 * loader.template 演示
 *
 * @author John Yuan
 * @version 1.0.0
 */
define(function(require, exports, module) {
    var $ = require('libs/zepto');
    var loader = require('loader/loader');

    exports.render = function(event) {
        var cssText = require('loader/deps/text!./template.less');
        var htmlText = require('loader/deps/text!./template.tpl');
        var rootElement = loader.view.render(module, cssText, htmlText);

        document.title = 'Template Example';

        // 使用 loader.template() API 进行模板编译
        // 注意: 必须使用 loader.template(require('loader/deps/text!${文件路径}')) 语法才能通过编译
        // 模板语法请参考 ejs 文档: http://ejs.co/
        var template = loader.template(require('loader/deps/text!./userInfo.ejs'));
        // 传入数据获取编译结果
        var renderedText = template({
            projectName: 'rs',
            projectGithub: 'https://github.com/john-yuan/rs',
            getViewName: function() {
                return event.targetView.viewName;
            }
        });

        console.log(template);
        console.log(renderedText);

        $(rootElement).find('.user-info').html(renderedText);
    };

    exports.destroy = function(event) {
        loader.view.destroy(module);
    };
});