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
            branches: 88,
            functions: 94,
            lines: 92,
            statements: 92,
        },
        './src/SiCard/*.js': totalCoverage,
        './src/SiCard/types': {
            branches: 75,
            functions: 92,
            lines: 89,
            statements: 90,
        },
        './src/SiDevice': totalCoverage,
        './src/simulation': {
            branches: 32,
            functions: 47,
            lines: 36,
            statements: 38,
        },
        './src/SiStation': {
            branches: 89,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/storage/**/*.js': totalCoverage,
        './src/utils/**/*.js': totalCoverage,
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
