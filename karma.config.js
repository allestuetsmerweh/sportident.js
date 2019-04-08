/* global module */
/* exported module */

module.exports = (config) => {
    config.set({
        basePath: '',
        preprocessors: {
            'src/**/test_*.js': ['webpack'],
        },
        webpack: {
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
        },
        files: [
            {pattern: 'src/**/test_*.js', watched: false},
        ],
        frameworks: ['jasmine'],
        plugins: [
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-webpack',
        ],
        browsers: ['PhantomJS'],
        singleRun: true,
    });
};
