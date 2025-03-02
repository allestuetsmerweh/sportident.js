import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default [
    {
        entry: './src/index.tsx',
        output: {
            path: path.resolve('./build'),
            filename: 'sportident-testbench-client.min.js',
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
                        path.resolve('./src'),
                        path.resolve('./node_modules/sportident/lib'),
                    ],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: '2' }],
                                ['@babel/preset-react', {}],
                            ],
                            plugins: [
                                '@babel/plugin-proposal-object-rest-spread',
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
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
            }),
        ],
        devServer: {
            contentBase: path.resolve('.'),
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
