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
    testRegex: '.*/.*\\.test\\.tsx?',
    testPathIgnorePatterns: ['node_modules/', 'lib/'],
    collectCoverage: true,
    maxConcurrency: 1,
    coverageThreshold: {
        './packages/sportident/src/': {
            branches: 94,
            functions: 98,
            lines: 99,
            statements: 99,
        },
        './packages/sportident/src/SiCard': {
            branches: 93,
            functions: 100,
            lines: 99,
            statements: 99,
        },
        './packages/sportident/src/SiDevice': percentCoverage(85),
        './packages/sportident/src/fakes': {
            branches: 92,
            functions: 100,
            lines: 97,
            statements: 97,
        },
        './packages/sportident/src/SiStation': {
            branches: 84,
            functions: 95,
            lines: 97,
            statements: 97,
        },
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
