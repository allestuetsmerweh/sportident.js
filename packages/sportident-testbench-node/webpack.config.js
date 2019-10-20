/* global __dirname, module, require */
/* exported module */

const path = require('path');
const pkg = require('./package.json');

const libraryName = pkg.name;

module.exports = [
    {
        target: 'node',
        entry: './src/index.ts',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'sportident-testbench-node.node.js',
            library: libraryName,
            libraryTarget: 'umd',
            publicPath: '/build/',
            umdNamedDefine: true,
        },
        mode: 'production',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader',
                },
                {
                    test: /\.jsx?$/,
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
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        stats: {
            colors: true,
        },
        devtool: 'source-map',
    },
];
