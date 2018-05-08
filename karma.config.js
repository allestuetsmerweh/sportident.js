/* global module */
/* exported module */

module.exports = (config) => {
    config.set({
        basePath: '',
        preprocessors: {
            'unit_tests/**/test_*.js': ['webpack'],
        },
        webpack: {
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
        },
        files: [
            {pattern: 'unit_tests/**/test_*.js', watched: false},
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
