const path = require('path');
const colors = require('colors');
const express = require('express');
const os = require('os');
const proxy = require('http-proxy').createProxyServer();
const devServer = express();
const distServer = express();
const APP_PATH = path.resolve(__dirname, '../../app');
const DIST_PATH = path.resolve(__dirname, '../../dist');
const ENTRY_PATH = 'index.html';

// 起始端口号
let BASE_SERVER_PORT = 8080;
// 是否启动开发服务器
let START_DEV_SERVER = true;
// 是否启动构建服务器
let START_DIST_SERVER = true;
// 接口反向代理目标域名，留空代表不使用反向代理
let PROXY_HOST = null;
// 接口反向代理目标 IP，留空代表使用 PROXY_HOST
let PROXY_IP = null;

const env = (process.argv[2] || 'dev').toLocaleLowerCase();

if (env === 'prod') {
    PROXY_IP = null;
} else if (env === 'test') {
    PROXY_IP = null;
} else {
    PROXY_IP = null;
}

// 获取本机 IP 地址
const getIPv4Address = function () {
    let interfaces = new os.networkInterfaces();
    let hasOwn = Object.prototype.hasOwnProperty;
    let IPv4Address = [];

    for (let prop in interfaces) {
        if (hasOwn.call(interfaces, prop)) {
            for (let info of interfaces[prop]) {
                if (info.family === 'IPv4') {
                    IPv4Address.push(info.address);
                }
            }
        }
    }

    return IPv4Address.reverse();
};

// 代理服务器初始化标志
let proxyServerInitialized = false;

// 初始化代理服务器
const initProxyServer = function () {
    if (!proxyServerInitialized) {
        proxyServerInitialized = true;
        // 代理出错时返回 500
        proxy.on('error', function (err, req, res) {
            res.status(500).send(err.stack);
        });

        // 移除接口反向代理响应头 Cookie 中的 Domain
        proxy.on('proxyRes', function (proxyRes, req, res) {
            let key, cookies;
            for (key in proxyRes.headers) {
                if (key.toString().toLocaleLowerCase() === 'set-cookie') {
                    cookies = proxyRes.headers[key];
                    break;
                }
            }
            if (cookies) {
                cookies.forEach(function (cookie, index) {
                    cookies[index] = cookie.replace(/(^|\;)\s*domain\=.*?(\;|$)/gi, '$2');
                });
            }
        });
    }
};

// 处理反向代理
const handleProxy = function (req, res) {
    if (PROXY_HOST) {
        initProxyServer();
        req.headers.host = PROXY_HOST;
        if (req.rawHeaders) {
            let hostIndex = 0;
            req.rawHeaders.forEach(function (value, index) {
                if (value.toLocaleLowerCase() === "host") {
                    hostIndex = index + 1;
                    return false;
                }
            });
            if (hostIndex) {
                req.rawHeaders[hostIndex] = PROXY_HOST;
            }
        }
        proxy.web(req, res, { target: `http://${PROXY_IP || PROXY_HOST}` });
    } else {
        res.status(404).end();
    }
};

// 静态文件服务器
devServer.use(express.static(APP_PATH));
distServer.use(express.static(DIST_PATH));

// 反向代理非静态文件
devServer.all('*', handleProxy);
distServer.all('*', handleProxy);

let devServerPort = BASE_SERVER_PORT, distServerPort;

const listenServer = function (server, basePort, callback) {
    server.listen(basePort, function () {
        callback && callback(null, basePort);
    }).on('error', function (err) {
        if (err && err.code === 'EADDRINUSE') {
            listenServer(server, basePort + 1, callback);
        } else {
            callback && callback(err || true);
        }
    });
};

const startDevServer = function () {
    return new Promise(function (resolve, reject) {
        if (START_DEV_SERVER) {
            listenServer(devServer, devServerPort, function (err, port) {
                if (err) {
                    reject(err);
                } else {
                    devServerPort = port;
                    resolve(devServerPort);
                }
            });
        } else {
            resolve(devServerPort);
        }
    });
};

const startDistServer = function () {
    return new Promise(function (resolve, reject) {
        if (START_DIST_SERVER) {
            listenServer(distServer, distServerPort, function (err, port) {
                if (err) {
                    reject(err);
                } else {
                    distServerPort = port;
                    resolve(distServerPort);
                }
            });
        } else {
            resolve(distServerPort);
        }
    });
};

startDevServer().then(function (devServerPort) {
    distServerPort = devServerPort + 1;
}).then(startDistServer).then(function () {
    const addresses = getIPv4Address();

    if (START_DEV_SERVER || START_DIST_SERVER) {
        console.log(colors.yellow(`        Env: `) + colors.green(env));

        if (PROXY_IP) {
            console.log(colors.yellow(`   Proxy-IP: `) + colors.green(`http://${PROXY_IP}`));
        }

        if (PROXY_HOST) {
            console.log(colors.yellow(` Proxy-Host: `) + colors.green(`http://${PROXY_HOST}`));
        }

        console.log();
    }

    if (START_DEV_SERVER) {
        addresses.forEach(function (ip) {
            console.log(colors.yellow(` App-Server: `) + colors.green(`http://${ip}:${devServerPort}/${ENTRY_PATH}`));
        });
        console.log();
    }

    if (START_DIST_SERVER) {
        addresses.forEach(function (ip) {
            console.log(colors.yellow(`Dist-Server: `) + colors.green(`http://${ip}:${distServerPort}/${ENTRY_PATH}`));
        });
    }
});
