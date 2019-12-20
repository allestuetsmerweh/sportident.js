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
- [sportident](../sportident/)
- [sportident-node-usb](../sportident-node-usb/)
- [sportident-react](../sportident-react/)
- [sportident-testbench-client](../sportident-testbench-client/)
- [sportident-testbench-node](../sportident-testbench-node/)
- [sportident-testbench-server](../sportident-testbench-server/)
- [sportident-testbench-shell](../sportident-testbench-shell/)
- [sportident-webusb](../sportident-webusb/)
