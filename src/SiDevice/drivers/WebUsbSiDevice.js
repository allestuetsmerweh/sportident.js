import {BaseSiDevice} from '../BaseSiDevice';

const siConfiguration = 1;
const siInterface = 0;
const siAlternate = 0;
const siEndpoint = 1;
const siPacketSize = 64;
const siDeviceFilters = [
    {vendorId: 0x10c4, productId: 0x800a},
];
const matchesSiDeviceFilters = (vendorId, productId) => siDeviceFilters
    .some((filter) => vendorId === filter.vendorId && productId === filter.productId);

export const getWebUsbSiDeviceClass = (navigatorArg) => {
    if (!('usb' in navigatorArg)) {
        return null;
    }
    class WebUsbSiDevice extends BaseSiDevice {
        static typeSpecificDetect() {
            return navigatorArg.usb.requestDevice({
                filters: siDeviceFilters,
            })
                .then((webUsbDevice) => new this(webUsbDevice));
        }

        static getTypeSpecificAutodetectedDevices() {
            return navigatorArg.usb.getDevices()
                .then((webUsbDevices) => webUsbDevices.filter((webUsbDevice) => matchesSiDeviceFilters(
                    webUsbDevice.vendorId,
                    webUsbDevice.productId,
                )))
                .then((webUsbDevices) => webUsbDevices.map((webUsbDevice) => new this(webUsbDevice)));
        }

        static registerTypeSpecificAutodetectionCallbacks() {
            const onConnectCallback = (event) => {
                if (!matchesSiDeviceFilters(event.device.vendorId, event.device.productId)) {
                    return;
                }
                this.handleAdd(new this(event.device));
            };
            navigatorArg.usb.addEventListener('connect', onConnectCallback);
            const onDisconnectCallback = (event) => {
                if (!matchesSiDeviceFilters(event.device.vendorId, event.device.productId)) {
                    return;
                }
                this.handleRemove(new this(event.device));
            };
            navigatorArg.usb.addEventListener('disconnect', onDisconnectCallback);

            return {
                onConnectCallback: onConnectCallback,
                onDisconnectCallback: onDisconnectCallback,
            };
        }

        static deregisterTypeSpecificAutodetectionCallbacks(autodetectionCallbacks) {
            navigatorArg.usb.removeEventListener('connect', autodetectionCallbacks.onConnectCallback);
            navigatorArg.usb.removeEventListener('disconnect', autodetectionCallbacks.onDisconnectCallback);
        }

        constructor(webUsbDevice) {
            super(webUsbDevice.serialNumber);
            this.webUsbDevice = webUsbDevice;
        }

        typeSpecificOpen() {
            console.debug('Opening...');
            return this.webUsbDevice.open()
                .then(() => {
                    console.debug('Resetting...');
                    return this.webUsbDevice.reset();
                })
                .then(() => {
                    console.debug('Selecting Configuration...');
                    return this.webUsbDevice.selectConfiguration(siConfiguration);
                })
                .then(() => {
                    console.debug('Claiming Interface...');
                    return this.webUsbDevice.claimInterface(siInterface);
                })
                .then(() => {
                    console.debug('Selection Alternate Interface...');
                    return this.webUsbDevice.selectAlternateInterface(siInterface, siAlternate);
                })
                .then(() => {
                    console.debug('Enabling Serial...');
                    return this.webUsbDevice.controlTransferOut({
                        requestType: 'vendor',
                        recipient: 'interface',
                        request: 0x00,
                        value: 0x01,
                        index: siInterface,
                    });
                })
                .then(() => {
                    console.debug('Setting Baudrate...');
                    return this.webUsbDevice.controlTransferOut({
                        requestType: 'vendor',
                        recipient: 'interface',
                        request: 0x1E,
                        value: 0x00,
                        index: siInterface,
                    }, new Uint8Array([0x00, 0x96, 0x00, 0x00]).buffer);
                });
        }

        typeSpecificClose() {
            console.debug('Disabling Serial...');
            return this.webUsbDevice.controlTransferOut({
                requestType: 'vendor',
                recipient: 'interface',
                request: 0x00,
                value: 0x00,
                index: siInterface,
            })
                .then(() => {
                    console.debug('Releasing Interface...');
                    return this.webUsbDevice.releaseInterface(siInterface);
                })
                .then(() => {
                    console.debug('Closing Device...');
                    return this.webUsbDevice.close();
                });
        }

        typeSpecificReceive() {
            if (this.webUsbDevice.opened !== true) {
                console.warn('Device has been closed. Stopping receive loop.');
                this.setSiDeviceState(this.constructor.State.Closed);
                throw new BaseSiDevice.DeviceClosedError();
            }
            return this.webUsbDevice.transferIn(siEndpoint, siPacketSize)
                .then((response) => {
                    const uint8Data = new Uint8Array(response.data.buffer);
                    return uint8Data;
                });
        }

        typeSpecificSend(buffer) {
            return this.webUsbDevice.transferOut(siEndpoint, buffer);
        }
    }
    return WebUsbSiDevice;
};
