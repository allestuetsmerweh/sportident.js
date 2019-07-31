/* eslint-env node */

const totalCoverage = {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
};

const jestConfig = {
    testRegex: '.*/.*\\.test\\.js',
    collectCoverage: true,
    maxConcurrency: 1,
    coverageThreshold: {
        'src/': {
            branches: 94,
            functions: 98,
            lines: 98,
            statements: 93,
        },
        './src/SiCard': totalCoverage,
        './src/SiDevice': totalCoverage,
        './src/simulation': totalCoverage,
        './src/SiStation': {
            branches: 89,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/storage': totalCoverage,
        './src/utils': totalCoverage,
        './src/constants.js': totalCoverage,
        './src/react.js': {
            branches: 14,
            functions: 54,
            lines: 61,
            statements: 58,
        },
        './src/siProtocol.js': totalCoverage,
        './src/testUtils.js': totalCoverage,
    },
};
module.exports = jestConfig;
