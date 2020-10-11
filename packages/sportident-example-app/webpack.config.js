/* global __dirname, module, require */
/* exported module */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
    {
        entry: './src/index.tsx',
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'sportident-example-app.min.js',
            publicPath: '/assets/',
            libraryTarget: 'umd',
        },
        mode: 'development',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader',
                },
                {
                    test: /\.jsx?$/,
                    // exclude: /node_modules/,
                    include: [
                        path.resolve(__dirname, 'src'),
                        path.resolve(__dirname, 'node_modules/sportident/lib'),
                    ],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: '2' }],
                                ['@babel/preset-react', {}],
                            ],
                            plugins: [
                                '@babel/plugin-proposal-object-rest-spread'
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/,
                    exclude: /node_modules/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: {
                react: path.resolve('./node_modules/react'),
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
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
