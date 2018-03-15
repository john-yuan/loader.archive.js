/**
 *
 */

const fse = require('fs-extra');
const path = require('path');
const printUtils = require('./printUtils');

let runtime = {};

module.exports = function (data) {
    runtime = data;
    return new Promise(function (resolve, reject) {

    });
};