/**
 * URL 参数解析模块
 *
 * @author John Yuan
 * @module loader/utils/urlParams
 * @version 1.0.0
 */
define(function(require, exports, module) {
    /**
     * 将简单数据对象编码为查询字符串
     *
     * @param {Object} data 简单数据对象(可包含的类型有 number, boolean, string)
     * @returns {String} 查询字符串
     */
    var encode = function(data) {
        var type, prop, key, val, queryString = [];
        var hasOwn = Object.prototype.hasOwnProperty;
        var toString = Object.prototype.toString;

        for (prop in data) {
            if (hasOwn.call(data, prop)) {
                key = encodeURIComponent(prop);
                val = data[prop];
                type = toString.call(val).slice(8, -1).toLowerCase();
                switch(type) {
                    case 'string':
                    case 'number':
                        queryString.push(key + '=' + encodeURIComponent(val));
                        break;
                    case 'boolean':
                        val && queryString.push(key);
                        break;
                    default:
                        if (val) {
                            try {
                                console.error(
                                    '名为 "' + prop
                                    + '" 的 URL 参数类型为不支持的类型 "'
                                    + type + '", 请检查!'
                                );
                                console.log(val);
                            } catch(e) {}
                        }
                }
            }
        }

        return queryString.join('&');
    };

    /**
     * 解析查询字符串为简单数据对象
     *
     * @param {String} queryString 查询字符串
     * @returns {Object}
     */
    var decode = function(queryString) {
        var i, pair, data = {}, pairs = ('' + queryString).split('&');

        for (i = 0; i < pairs.length; i += 1) {
            pair = pairs[i].split('=');
            if (pair.length === 2) {
                data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            } else if (pair[0]) {
                data[decodeURIComponent(pair[0])] = true;
            }
        }

        return data;
    };

    exports.encode = encode;
    exports.decode = decode;
});