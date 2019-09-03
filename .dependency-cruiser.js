/* global module */
/* exported module */

const recommendedForbidden = [
    {
        name: 'no-circular',
        severity: 'warn',
        comment: 'Warn in case there\'s circular dependencies',
        from: {},
        to: {
            circular: true,
        },
    },
    {
        name: 'no-orphans',
        severity: 'info',
        comment: 'Inform in case there\'s orphans hiding in the code base',
        from: {
            orphan: true,
            pathNot: '\\.d\\.ts$',
        },
        to: {},
    },
    {
        name: 'no-deprecated-core',
        comment: 'Warn about dependencies on deprecated core modules.',
        severity: 'warn',
        from: {},
        to: {
            dependencyTypes: [
                'core',
            ],
            path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$',
        },
    },
    {
        name: 'no-deprecated-npm',
        comment: 'These npm modules are deprecated - find an alternative.',
        severity: 'warn',
        from: {},
        to: {
            dependencyTypes: [
                'deprecated',
            ],
        },
    },
    {
        name: 'no-non-package-json',
        severity: 'error',
        comment: 'Don\'t allow dependencies to packages not in package.json',
        from: {},
        to: {
            dependencyTypes: [
                'npm-no-pkg',
                'npm-unknown',
            ],
        },
    },
    {
        name: 'not-to-unresolvable',
        comment: 'Don\'t allow dependencies on modules dependency-cruiser can\'t resolve to files on disk (which probably means they don\'t exist)',
        severity: 'error',
        from: {},
        to: {
            couldNotResolve: true,
        },
    },
    // We want this for react stuff
    // {
    //     name: 'no-duplicate-dep-types',
    //     comment: 'Warn if a dependency you\'re actually using occurs in your package.json more than once (technically: has more than one dependency type)',
    //     severity: 'warn',
    //     from: {},
    //     to: {
    //         moreThanOneDependencyType: true,
    //     },
    // },
];

const customForbidden = [
    {
        name: 'not-to-test',
        comment: 'Don\'t allow dependencies from outside to test files',
        severity: 'error',
        from: {
            pathNot: '\\.test\\.(j|t)sx?$|testUtils\\.(j|t)sx?$|/testUtils/',
        },
        to: {
            path: '\\.test\\.(j|t)sx?$|testUtils\\.(j|t)sx?$|/testUtils/',
        },
    },
    {
        name: 'not-to-testbench',
        comment: 'Don\'t allow dependencies from outside to testbench',
        severity: 'error',
        from: {
            pathNot: '^testbench',
        },
        to: {
            path: '^testbench',
        },
    },
    {
        name: 'not-to-src-si-device-drivers',
        comment: 'Don\'t allow dependencies from outside to src/SiDevice/drivers',
        severity: 'error',
        from: {
            pathNot: '^(src/SiDevice/)',
        },
        to: {
            path: '^src/SiDevice/drivers',
        },
    },
    {
        name: 'not-from-testbench-inside-src',
        comment: 'Don\'t allow dependencies from testbench to src except index.(j|t)s[x]',
        severity: 'error',
        from: {
            path: '^testbench',
        },
        to: {
            path: '^src',
            pathNot: '^src/index\\.(j|t)sx?',
        },
    },
    {
        name: 'not-from-utils-outside',
        comment: 'Don\'t allow dependencies from utils outside utils',
        severity: 'error',
        from: {
            path: '^utils/',
        },
        to: {
            pathNot: '^utils/',
        },
    },
    {
        name: 'not-to-simulation',
        comment: 'Don\'t allow dependencies from non-tests to simulation',
        severity: 'error',
        from: {
            pathNot: '\\.test\\.(j|t)sx?$|testUtils\\.(j|t)sx?$|/testUtils/|/simulation/',
        },
        to: {
            path: '^simulation/',
        },
    },
];

module.exports = {
    forbidden: [
        ...recommendedForbidden,
        ...customForbidden,
    ],
    options: {

        /* conditions specifying which files not to follow further when encountered:
           - path: a regular expression to match
           - dependencyTypes: see https://github.com/sverweij/dependency-cruiser/blob/develop/doc/rules-reference.md#dependencytypes
             for a complete list
        */
        doNotFollow: {
            // path: 'node_modules',
            dependencyTypes: [
                'npm',
                'npm-dev',
                'npm-optional',
                'npm-peer',
                'npm-bundled',
                'npm-no-pkg',
            ],
        },

        /* pattern specifying which files to exclude (regular expression) */
        exclude: '\\.min\\.(j|t)sx?$|webpack\\.config\\.(j|t)sx?$',

        /* pattern specifying which files to include (regular expression)
           dependency-cruiser will skip everything not matching this pattern
        */
        // , includeOnly : ''

        /* list of module systems to cruise */
        // , moduleSystems: ['amd', 'cjs', 'es6', 'tsd']

        /* prefix for links in html and svg output (e.g. https://github.com/you/yourrepo/blob/develop/) */
        // , prefix: ''

        /* if true detect dependencies that only exist before typescript-to-javascript compilation */
        // , tsPreCompilationDeps: false

        /* if true combines the package.jsons found from the module up to the base
           folder the cruise is initiated from. Useful for how (some) mono-repos
           manage dependencies & dependency definitions.
         */
        // , combinedDependencies: false

        /* if true leave symlinks untouched, otherwise use the realpath */
        // , preserveSymlinks: false

        /* Typescript project file ('tsconfig.json') to use for
           (1) compilation and
           (2) resolution (e.g. with the paths property)

           The (optional) fileName attribute specifies which file to take (relative to
           dependency-cruiser's current working directory). When not provided
           defaults to './tsconfig.json'.
         */
        // , tsConfig: {
        //    fileName: './tsconfig.json'
        // }

        /* Webpack configuration to use to get resolve options from.

          The (optional) fileName attribute specifies which file to take (relative to dependency-cruiser's
          current working directory. When not provided defaults to './webpack.conf.js'.

          The (optional) `env` and `args` attributes contain the parameters to be passed if
          your webpack config is a function and takes them (see webpack documentation
          for details)
         */
        // , webpackConfig: {
        //    fileName: './webpack.conf.js'
        //    , env: {}
        //    , args: {}
        // }

        /* How to resolve external modules - use "yarn-pnp" if you're using yarn's Plug'n'Play.
           otherwise leave it out (or set to the default, which is 'node_modules')
        */
        // , externalModuleResolutionStrategy: 'node_modules'
    },
};
// generated: dependency-cruiser@4.21.0 on 2019-06-09T07:26:46.829Z
