/* global __dirname, module, require */
/* exported module */

const path = require('path');

module.exports = [
    {
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'si.min.js',
        },
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
        },
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
        stats: {
            colors: true,
        },
        devtool: 'source-map',
    },
];
