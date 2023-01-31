# sportident.js
JavaScript/TypeScript interface to SportIdent devices

There are [generated docs](https://allestuetsmerweh.github.io/sportident.js/).

## How to install

- [Install node.js](https://nodejs.org/en/download/)
- `git clone` this repository and `cd` to the root directory of it
- `npm install`
- `npm run lerna bootstrap`

## How to run testbench
- `npm run testbench-client`
- `npm run testbench-server`

## How to run...
- Tests: `npm run test`
- Linter: `npm run lint`
- Build: `npm run build` (this compiles TypeScript for the libraries and builds the webpack file for `sportident-testbench-client`)

## Development
We use `lerna` to manage multiple packages in the same repository:
- [sportident](./tree/main/packages/sportident/#readme)
- [sportident-node-usb](./tree/main/packages/sportident-node-usb/#readme)
- [sportident-react](./tree/main/packages/sportident-react/#readme)
- [sportident-testbench-client](./tree/main/packages/sportident-testbench-client/#readme)
- [sportident-testbench-node](./tree/main/packages/sportident-testbench-node/#readme)
- [sportident-testbench-server](./tree/main/packages/sportident-testbench-server/#readme)
- [sportident-testbench-shell](./tree/main/packages/sportident-testbench-shell/#readme)
- [sportident-webusb](./tree/main/packages/sportident-webusb/#readme)
