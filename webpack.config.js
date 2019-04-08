/* global __dirname, module, require */
/* exported module */

const path = require('path');

module.exports = [
    {
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'si.min.js',
            publicPath: '/assets/',
        },
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: [
                            ['@babel/preset-env', {useBuiltIns: 'usage', corejs: '2'}],
                        ],
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
    },
    {
        entry: './testbench/index.js',
        output: {
            path: path.resolve(__dirname, 'docs', 'testbench'),
            filename: 'testbench.min.js',
            publicPath: '/assets/',
        },
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: [
                            ['@babel/preset-env', {useBuiltIns: 'usage', corejs: '2'}],
                        ],
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
    },
];
