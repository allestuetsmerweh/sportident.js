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
        '^.+\\.(js|jsx|mjs)$': '<rootDir>/node_modules/babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '.*/.*\\.test\\.(jsx?|tsx?)',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    collectCoverage: true,
    maxConcurrency: 1,
    coverageThreshold: {
        './packages/sportident/src/': {
            branches: 94,
            functions: 94,
            lines: 95,
            statements: 93,
        },
        './packages/sportident/src/SiCard': percentCoverage(90),
        './packages/sportident/src/SiDevice': percentCoverage(85),
        './packages/sportident/src/simulation': totalCoverage,
        './packages/sportident/src/SiStation': {
            branches: 89,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './packages/sportident/src/storage': totalCoverage,
        './packages/sportident/src/utils': percentCoverage(97),
        './packages/sportident/src/constants.ts': totalCoverage,
        './packages/sportident/src/siProtocol.ts': totalCoverage,
        './packages/sportident/src/testUtils.ts': totalCoverage,
    },
};
module.exports = jestConfig;
