/* eslint-env node */

const totalCoverage = {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
};

const percentCoverage = (percent) => ({
    branches: percent,
    functions: percent,
    lines: percent,
    statements: percent,
})

const jestConfig = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testEnvironment: 'jsdom',
    testRegex: '.*/.*\\.test\\.tsx?',
    testPathIgnorePatterns: ['node_modules/', 'lib/', '__snapshots__/'],
    collectCoverage: true,
    collectCoverageFrom: [
        './**/src/**/*',
    ],
    coveragePathIgnorePatterns: ['node_modules/', 'lib/', '__snapshots__/'],
    maxConcurrency: 1,
    coverageThreshold: {
        './packages/sportident/src/': {
            branches: 93,
            functions: 89,
            lines: 89,
            statements: 89,
        },
        './packages/sportident/src/SiCard': percentCoverage(93),
        './packages/sportident/src/SiDevice': percentCoverage(44),
        './packages/sportident/src/fakes': percentCoverage(43),
        './packages/sportident/src/SiStation': percentCoverage(84),
        './packages/sportident/src/storage': {
            branches: 96,
            functions: 97,
            lines: 99,
            statements: 99,
        },
        './packages/sportident/src/utils': totalCoverage,
        './packages/sportident/src/constants.ts': totalCoverage,
        './packages/sportident/src/siProtocol.ts': totalCoverage,
        './packages/sportident/src/testUtils.ts': totalCoverage,
    },
};
module.exports = jestConfig;
