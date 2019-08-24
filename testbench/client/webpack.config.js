/* global __dirname, module, require */
/* exported module */

const path = require('path');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');

module.exports = [
    {
        entry: './index.jsx',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'testbench.min.js',
            publicPath: '/assets/',
            libraryTarget: 'umd',
        },
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: [
                            ['@babel/preset-env', {useBuiltIns: 'usage', corejs: '2'}],
                            ['@babel/preset-react', {}],
                        ],
                    },
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    loader: 'html-loader',
                },
                {
                    test: /\.css$/,
                    exclude: /node_modules/,
                    loader: 'css-loader',
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.jsx'],
        },
        plugins: [
            new StaticSiteGeneratorPlugin({
                globals: {
                    window: {},
                },
            }),
        ],
        devServer: {
            contentBase: __dirname,
            publicPath: '/',
            compress: true,
            inline: false,
            port: 41270,
            watchContentBase: true,
        },
        stats: {
            colors: true,
        },
        devtool: 'source-map',
    },
];
