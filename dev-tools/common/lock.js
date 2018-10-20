const fse = require('fs-extra');

/**
 * 加锁操作
 *
 * @param {string} lcokfilepath
 * @param {number} [maxWaitTime=10000]
 * @param {number} [intervalTime=500]
 * @returns {Promise}
 */
const lock = function (lcokfilepath, maxWaitTime, intervalTime) {
    maxWaitTime = maxWaitTime || 10000;
    intervalTime = intervalTime || 500;

    return new Promise(function (resolve, reject) {
        let timeUsed = 0;
        let check = callback => {
            if (fse.pathExistsSync(lcokfilepath)) {
                if (timeUsed >= maxWaitTime) {
                    let err = new Error('Lock Timeout.');
                    err.LOCK_ERROR = true;
                    callback(err);
                } else {
                    setTimeout(() => {
                        timeUsed += intervalTime;
                        check(callback);
                    }, intervalTime);
                }
            } else {
                callback(null);
            }
        };
        check((err) => {
            if (err) {
                reject(err);
            } else {
                let passed = false;
                try {
                    fse.outputFileSync(lcokfilepath, Date.now());
                    passed = true;
                } catch (e) {
                    let err = new Error('Create lock file failed.\n' + e.stack);
                    err.LOCK_ERROR = true;
                    reject(err);
                }
                if (passed) {
                    resolve(function (onError) {
                        try {
                            fse.removeSync(lcokfilepath);
                        } catch (e) {
                            if (onError) {
                                let err = new Error('Remove lock file failed.\n' + e.stack);
                                err.LOCK_ERROR = true;
                                onError(err);
                            }
                        }
                    });
                }
            }
        });
    });
};

module.exports = lock;
