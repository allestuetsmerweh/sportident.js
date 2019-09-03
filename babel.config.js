/* global module */
/* exported module */

module.exports = (api) => {
    api.cache(true);

    const presets = [
        ['@babel/typescript'],
        ['@babel/preset-env', {useBuiltIns: 'usage', corejs: '2'}],
        ['@babel/preset-react'],
    ];
    const plugins = [
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread'
    ];

    return {
        presets: presets,
        plugins: plugins,
    };
};
