mkdir -p docs/.circleci
cp .circleci/config.yml docs/.circleci/

mkdir -p docs/testbench
npm run webpack-testbench
cp testbench/build/testbench.min.js docs/testbench/
cp testbench/build/index.html docs/testbench/

mkdir -p docs/generated
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --output-type=dot src | dot -T svg > docs/generated/dependencygraph-src.svg
./node_modules/dependency-cruiser/bin/dependency-cruise --config=./.dependency-cruiser.js --output-type=dot testbench | dot -T svg > docs/generated/dependencygraph-testbench.svg
