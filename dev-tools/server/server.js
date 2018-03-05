const path = require('path');
const colors = require('colors');
const express = require('express');
const port = process.argv[2] || 8080;
const root = path.resolve(__dirname, `../../${ process.argv[3] || 'app' }`);
const app = express();

app.use(express.static(root)).listen(port);

console.info(colors.green(`The root directory is: ${root}`));
console.info(colors.green(`Server is running at http://127.0.0.1:${port}/`));