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
        'src/': {
            branches: 94,
            functions: 94,
            lines: 95,
            statements: 93,
        },
        './src/SiCard': percentCoverage(90),
        './src/SiDevice': percentCoverage(85),
        './src/simulation': totalCoverage,
        './src/SiStation': {
            branches: 89,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/storage': totalCoverage,
        './src/utils': percentCoverage(97),
        './src/constants.ts': totalCoverage,
        './src/react.jsx': {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
        },
        './src/siProtocol.ts': totalCoverage,
        './src/testUtils.ts': totalCoverage,
    },
};
module.exports = jestConfig;
