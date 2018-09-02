/* global __dirname, module, require */
/* exported module */

const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'main.bundle.js',
        publicPath: '/assets/',
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015'],
                },
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'testbench'),
        publicPath: '/assets/',
        compress: true,
        port: 41270,
        watchContentBase: true,
    },
    stats: {
        colors: true,
    },
    devtool: 'source-map',
};
