/* global __dirname, module, require */
/* exported module */

const path = require('path');

module.exports = [
    {
        entry: './index.js',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'si.min.js',
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
        stats: {
            colors: true,
        },
        devtool: 'source-map',
    },
];
