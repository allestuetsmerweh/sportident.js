import type {Config} from 'jest';

const totalCoverage = {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
};

const percentCoverage = (percent: number) => ({
    branches: percent,
    functions: percent,
    lines: percent,
    statements: percent,
})

const jestConfig: Config = {
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
        global: percentCoverage(18),
        './packages/sportident/src/': {
            branches: 92,
            functions: 89,
            lines: 89,
            statements: 88,
        },
        './packages/sportident/src/SiCard': percentCoverage(92),
        './packages/sportident/src/SiDevice': percentCoverage(44),
        './packages/sportident/src/fakes': percentCoverage(43),
        './packages/sportident/src/SiStation': percentCoverage(83),
        './packages/sportident/src/storage': totalCoverage,
        './packages/sportident/src/utils': totalCoverage,
        './packages/sportident/src/constants.ts': totalCoverage,
        './packages/sportident/src/siProtocol.ts': totalCoverage,
        './packages/sportident/src/testUtils.ts': totalCoverage,
    },
};
export default jestConfig;
