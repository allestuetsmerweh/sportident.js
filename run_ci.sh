#!/bin/sh

yarn run tests
mv build committed_build
yarn run webpack
diff -rq build committed_build
