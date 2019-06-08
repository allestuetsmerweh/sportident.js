npm run webpack-testbench
mkdir -p docs/.circleci
cp .circleci/config.yml docs/.circleci/
mkdir -p docs/testbench
cp testbench/build/testbench.min.js docs/testbench/
cp testbench/build/index.html docs/testbench/
./node_modules/dependency-cruiser/bin/dependency-cruise --config ./.dependency-cruiser.json --output-type dot src testbench | dot -T svg > docs/dependencygraph.svg
