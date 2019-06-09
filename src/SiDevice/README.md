# Drivers

There are different ways to open a serial data connection to a SportIdent Main Station.
Some Examples:
- [WebUSB](https://wicg.github.io/webusb/)
- [`chrome.serial`](https://developer.chrome.com/apps/serial)
- [`chrome.usb`](https://developer.chrome.com/apps/usb)
- Your custom python script piping the serial port into a WebSocket, which JavaScript then talks to

## Interface
see [`BaseSiDevice`](BaseSiDevice.js)
