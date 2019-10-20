# Assumes the following commands have been run:
# - npm run webpack-testbench
# - npm run jest

mkdir -p docs/.circleci
cp .circleci/config.yml docs/.circleci/

mkdir -p docs/testbench
cp packages/sportident-testbench-client/build/sportident-testbench-client.min.js docs/testbench/
cp packages/sportident-testbench-client/build/index.html docs/testbench/

mkdir -p docs/coverage
cp -R coverage/* docs/coverage/

mkdir -p docs/generated
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident/src | dot -T svg > docs/generated/dependencygraph-src.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident/src/SiCard | dot -T svg > docs/generated/dependencygraph-src-sicard.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident/src/SiDevice | dot -T svg > docs/generated/dependencygraph-src-sidevice.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident/src/SiStation | dot -T svg > docs/generated/dependencygraph-src-sistation.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident/src/utils | dot -T svg > docs/generated/dependencygraph-src-utils.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --max-depth=1 --output-type=dot packages/sportident-testbench-client/src | dot -T svg > docs/generated/dependencygraph-testbench.svg
