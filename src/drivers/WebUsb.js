import {BaseDriver} from './BaseDriver';

const siConfiguration = 1;
const siInterface = 0;
const siAlternate = 0;
const siEndpoint = 1;
const siPacketSize = 64;
const siDeviceFilters = [
    {vendorId: 0x10c4, productId: 0x800a},
];


export class WebUsb extends BaseDriver {
    get name() {
        return 'WebUSB';
    }

    new(MainStation) {
        if (!('usb' in navigator)) {
            return;
        }
        navigator.usb.requestDevice({
            filters: siDeviceFilters,
        })
            .then((selectedDevice) => {
                if (!(`USB-${selectedDevice.serialNumber}` in MainStation.allByDevice)) {
                    new MainStation({
                        ident: `USB-${selectedDevice.serialNumber}`,
                        name: selectedDevice.productName,
                        driver: this,
                        _device: selectedDevice,
                    });
                }
            });
    }

    detect(MainStation) {
        if (!('usb' in navigator)) {
            return;
        }
        navigator.usb.getDevices().then((devices) => {
            devices.map((device) => {
                const matchesSiDeviceFilter = siDeviceFilters.findIndex((filter) =>
                    device.vendorId === filter.vendorId && device.productId === filter.productId) !== -1;
                if (matchesSiDeviceFilter) {
                    if (!(`USB-${device.serialNumber}` in MainStation.allByDevice)) {
                        new MainStation({
                            ident: `USB-${device.serialNumber}`,
                            name: device.productName,
                            driver: this,
                            _device: device,
                        });
                    }
                }
            });
        });
    }

    open(mainStation) {
        return new Promise((resolve, _reject) => {
            const dev = mainStation.device._device;

            mainStation.device._receiveLoop = () => {
                dev.transferIn(siEndpoint, siPacketSize)
                    .then((response) => {
                        mainStation.device._receiveLoop();
                        var bufView = new Uint8Array(response.data.buffer);
                        mainStation._logReceive(bufView);
                        for (var i = 0; i < bufView.length; i++) {
                            mainStation._respBuffer.push(bufView[i]);
                        }
                        mainStation._processReceiveBuffer();
                    })
                    .catch((err) => {
                        console.warn(err);
                        mainStation._remove();
                    });
            };

            console.debug('Opening...', mainStation.device);
            dev.open()
                .then(() => {
                    console.debug('Resetting...', dev);
                    return dev.reset();
                })
                .then(() => {
                    console.debug('Selecting Configuration...', dev);
                    return dev.selectConfiguration(siConfiguration);
                })
                .then(() => {
                    console.debug('Claiming Interface...', dev);
                    return dev.claimInterface(siInterface);
                })
                .then(() => {
                    console.debug('Selection Alternate Interface...', dev);
                    return dev.selectAlternateInterface(siInterface, siAlternate);
                })
                .then(() => {
                    console.debug('Enabling Serial...');
                    return dev.controlTransferOut({
                        requestType: 'vendor',
                        recipient: 'interface',
                        request: 0x00,
                        value: 0x01,
                        index: siInterface,
                    });
                })
                .then(() => {
                    console.debug('Setting Baudrate...');
                    return dev.controlTransferOut({
                        requestType: 'vendor',
                        recipient: 'interface',
                        request: 0x1E,
                        value: 0x00,
                        index: siInterface,
                    }, new Uint8Array([0x00, 0x96, 0x00, 0x00]).buffer);
                })
                .then(() => {
                    console.debug('Starting Receive Loop...');
                    mainStation.device._receiveLoop();
                    resolve();
                });
        });
    }

    close(mainStation) {
        return new Promise((resolve, _reject) => {
            const dev = mainStation.device._device;
            console.debug('Disabling Serial...');
            dev.controlTransferOut({
                requestType: 'vendor',
                recipient: 'interface',
                request: 0x00,
                value: 0x00,
                index: siInterface,
            })
                .then(() => {
                    console.debug('Releasing Interface...');
                    return dev.releaseInterface(siInterface);
                })
                .then(() => {
                    console.debug('Closing Device...');
                    return dev.close();
                })
                .then(() => {
                    resolve();
                });
        });
    }

    send(mainStation, buffer) {
        const dev = mainStation.device._device;
        return dev.transferOut(siEndpoint, buffer);
    }
}

export default WebUsb;
