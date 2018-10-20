define(['module'], function (module) {
    return {
        load: function (name, req, onload, config) {
            var renderDep = 'loader/plugin/text!' + name;
            req([ renderDep, 'loader/deps/ejs' ], function (template, ejs) {
                var render = ejs.compile(template, {
                    compileDebug: true,
                    // 不要修改以下配置项的值，因为预编译 EJS 会使用这些值
                    _with: false,
                    localsName: 'data',
                    rmWhitespace: true
                });
                onload(render);
            });
        }
    };
});
