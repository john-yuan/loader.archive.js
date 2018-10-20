/**
 * 查询字符串操作模块
 *
 * @author John Yuan
 * @module loader/utils/queryString
 * @version 1.0.0
 */
define(function(require, exports, module) {
    var protoToString = Object.prototype.toString;
    var protoHasOwn = Object.prototype.hasOwnProperty;

    /**
     * 获取数据类型
     *
     * @param {any} it 需要判断类型的数据
     * @returns {string} 数据类型
     */
    var getType = function (it) {
        return protoToString.call(it).slice(8, -1).toLowerCase();
    };

    /**
     * 添加查询字符串键值对
     *
     * @param {string} key 键
     * @param {any} value 值
     * @param {string[]} keyValues 用于保存结果的字符串数组
     */
    var pushQsKey = function (key, value, keyValues) {
        var l, k, itemValue, itemType, valueType = getType(value);
        if (valueType === 'object') {
            for (k in value) {
                if (protoHasOwn.call(value, k)) {
                    pushQsKey(key + '[' + k + ']', value[k], keyValues);
                }
            }
        } else if (valueType === 'array') {
            for (k = 0, l = value.length; k < l; k += 1) {
                itemValue = value[k];
                itemType = getType(itemValue);
                if (itemType === 'function') {
                    itemValue = itemValue();
                    itemType = getType(itemValue);
                }
                if (itemType === 'array' || itemType === 'object') {
                    pushQsKey(key + '[' + k + ']', itemValue, keyValues);
                } else {
                    pushQsKey(key + '[]', itemValue, keyValues);
                }
            }
        } else if (valueType === 'function') {
            pushQsKey(key, value(), keyValues);
        } else {
            keyValues.push(
                encodeURIComponent(key)
                + '='
                + encodeURIComponent(value == null ? '' : value)
            );
        }
    };

    /**
     * 解析查询字符串键值对
     *
     * @param {Object} data 用于保存解析数据的对象
     * @param {Object} cache 用于保存缓存的对象
     * @param {string} key 键
     * @param {any} value 值
     * @param {(value: string, key: string) => any} [valueProcesser] 数据处理函数
     */
    var parseQsKey = function (data, cache, key, value, valueProcesser) {
        var rbracket = /\[([^\[]*?)?\]$/;
        var parentKey, indexOrKey, arrayOrObject;

        if (typeof value === 'string' && valueProcesser !== null) {
            value = valueProcesser(value, key);
        }

        if (rbracket.test(key)) {
            indexOrKey = RegExp.$1;
            parentKey = key.replace(rbracket, '');

            if (cache[parentKey]) {
                arrayOrObject = cache[parentKey];
                if (indexOrKey) {
                    arrayOrObject[indexOrKey] = value;
                } else if (getType(arrayOrObject) === 'array') {
                    arrayOrObject[arrayOrObject.length] = value;
                } else {
                    arrayOrObject[indexOrKey] = value;
                }
            } else {
                if (!indexOrKey || /^\d+$/.test(indexOrKey)) {
                    arrayOrObject = [];
                    if (indexOrKey) {
                        arrayOrObject[indexOrKey] = value;
                    } else {
                        arrayOrObject[arrayOrObject.length] = value;
                    }
                } else {
                    arrayOrObject = {};
                    arrayOrObject[indexOrKey] = value;
                }
            }

            cache[parentKey] = arrayOrObject;
            parseQsKey(data, cache, parentKey, arrayOrObject, valueProcesser);
        } else {
            data[key] = value;
        }
    };

    /**
     * 编码查询字符串
     *
     * @param {Object} query 需要序列化的数据对象
     * @returns {string} URI 编码后的序列化字符串
     */
    var encodeQueryString = function (query) {
        var key, keyValues = [];

        if (query && getType(query) === 'object') {
            for (key in query) {
                if (protoHasOwn.call(query, key)) {
                    pushQsKey(key, query[key], keyValues);
                }
            }
        }

        return keyValues.join('&');
    };

    /**
     * 解析查询字符串
     *
     * @param {string} queryString 查询字符串
     * @param {(value: string, key: string) => any} [valueProcesser] 数据处理函数
     * @returns {Object} 解析后的数据对象
     */
    var decodeQueryString = function (queryString, valueProcesser) {
        var i, l, keyPair, key, value;
        var data = {}, cache = {};
        var keyPairs = ('' + queryString).split('&');

        if (getType(valueProcesser) !== 'function') {
            valueProcesser = null;
        }

        for (i = 0, l = keyPairs.length; i < l; i += 1) {
            keyPair = keyPairs[i];
            if (keyPair) {
                keyPair = keyPair.split('=');
                key = decodeURIComponent(keyPair[0]);
                value = keyPair[1] ? decodeURIComponent(keyPair[1]) : '';
                parseQsKey(data, cache, key, value, valueProcesser);
            }
        }

        return data;
    };

    exports.encodeQueryString = encodeQueryString;
    exports.decodeQueryString = decodeQueryString;
});
