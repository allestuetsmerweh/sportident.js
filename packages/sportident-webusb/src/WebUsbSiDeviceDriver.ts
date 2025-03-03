import * as utils from 'sportident/lib/utils';
import {DeviceClosedError, ISiDevice, ISiDeviceDriverData, SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import {ISiDeviceDriver, ISiDeviceDriverWithAutodetection, ISiDeviceDriverWithDetection, SiDeviceDriverWithAutodetectionEvents, SiDeviceAddEvent, SiDeviceRemoveEvent} from 'sportident/lib/SiDevice/ISiDeviceDriver';
import {SiDevice} from 'sportident/lib/SiDevice/SiDevice';

const siConfiguration = 1;
const siInterface = 0;
const siAlternate = 0;
const siEndpoint = 1;
const siPacketSize = 64;
const siDeviceFilters = [
    {vendorId: 0x10c4, productId: 0x800a},
];
const matchesSiDeviceFilters = (
    vendorId: number,
    productId: number,
) => siDeviceFilters.some(
    (filter) => (
        vendorId === filter.vendorId
        && productId === filter.productId
    ),
);

const getIdent = (device: USBDevice) => `${device.serialNumber}`;

export interface WebUsbSiDeviceDriverData extends ISiDeviceDriverData<WebUsbSiDeviceDriver> {
    driver: WebUsbSiDeviceDriver;
    device: USBDevice;
}

interface WebUsbAutodetectionCallbacks {
    onConnect: utils.EventCallback<USBConnectionEvent>;
    onDisconnect: utils.EventCallback<USBConnectionEvent>;
}

export type IWebUsbSiDevice = ISiDevice<WebUsbSiDeviceDriverData>;
export type WebUsbSiDevice = SiDevice<WebUsbSiDeviceDriverData>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class WebUsbSiDeviceDriver implements
        ISiDeviceDriver<WebUsbSiDeviceDriverData>,
        ISiDeviceDriverWithDetection<WebUsbSiDeviceDriverData, []>,
        ISiDeviceDriverWithAutodetection<WebUsbSiDeviceDriverData> {
    public name = 'WebUSB';

    private siDeviceByIdent:
        {[ident: string]: WebUsbSiDevice} = {};

    private autodetectedSiDevices:
        {[ident: string]: WebUsbSiDevice} = {};

    private autodetectionCallbacks?: WebUsbAutodetectionCallbacks;

    constructor(
        protected navigatorUsb: USB,
    ) {}

    detect(): Promise<WebUsbSiDevice> {
        return this.navigatorUsb.requestDevice({
            filters: siDeviceFilters,
        })
            .then((navigatorWebUsbDevice: USBDevice) => (
                this.autodetectSiDevice(navigatorWebUsbDevice)
            ));
    }

    getSiDevice(
        navigatorWebUsbDevice: USBDevice,
    ): WebUsbSiDevice {
        const ident = getIdent(navigatorWebUsbDevice);
        if (this.siDeviceByIdent[ident] !== undefined) {
            return this.siDeviceByIdent[ident];
        }
        const newSiDeviceData: WebUsbSiDeviceDriverData = {
            driver: this,
            device: navigatorWebUsbDevice,
        };
        const newSiDevice = new SiDevice(ident, newSiDeviceData);
        this.siDeviceByIdent[ident] = newSiDevice;
        return newSiDevice;
    }

    forgetSiDevice(
        siDevice: WebUsbSiDevice,
    ) {
        const navigatorWebUsbDevice = siDevice.data.device;
        const ident = getIdent(navigatorWebUsbDevice);
        delete this.siDeviceByIdent[ident];
        if (this.autodetectedSiDevices[ident] !== undefined) {
            this.dispatchEvent(new SiDeviceRemoveEvent(siDevice));
        }
        delete this.autodetectedSiDevices[ident];
    }

    startAutoDetection(): Promise<IWebUsbSiDevice[]> {
        this.registerAutodetectionCallbacks();
        return this.getAutodetectedDevices();
    }

    getAutodetectedDevices(): Promise<WebUsbSiDevice[]> {
        return this.navigatorUsb.getDevices()
            .then((navigatorWebUsbDevices: USBDevice[]) => (
                this.autodetectSiDevices(navigatorWebUsbDevices)
            ));
    }

    autodetectSiDevices(
        navigatorWebUsbDevices: USBDevice[],
    ): Promise<WebUsbSiDevice[]> {
        // TODO: Make this easier when Promise.allSettled polyfill is available
        return new Promise((resolve) => {
            let numSettled = 0;
            const devices: WebUsbSiDevice[] = [];
            const onSettled = () => {
                numSettled += 1;
                if (numSettled === navigatorWebUsbDevices.length) {
                    resolve(devices);
                }
            };
            navigatorWebUsbDevices.forEach(
                (navigatorWebUsbDevice: USBDevice) => (
                    this.autodetectSiDevice(navigatorWebUsbDevice)
                        .then((siDevice: WebUsbSiDevice) => {
                            devices.push(siDevice);
                            onSettled();
                        })
                        .catch(() => onSettled())
                ),
            );
        });
    }

    autodetectSiDevice(
        navigatorWebUsbDevice: USBDevice,
    ): Promise<WebUsbSiDevice> {
        if (!matchesSiDeviceFilters(
            navigatorWebUsbDevice.vendorId,
            navigatorWebUsbDevice.productId,
        )) {
            return Promise.reject(new Error('Not a SI device'));
        }
        const ident = getIdent(navigatorWebUsbDevice);
        if (this.autodetectedSiDevices[ident] !== undefined) {
            return Promise.reject(new Error('Duplicate SI device'));
        }
        const siDevice = this.getSiDevice(navigatorWebUsbDevice);
        this.autodetectedSiDevices[ident] = siDevice;
        return siDevice.open();
    }

    registerAutodetectionCallbacks(): void {
        if (this.autodetectionCallbacks !== undefined) {
            return;
        }
        const onConnectCallback = (event: USBConnectionEvent) => {
            const navigatorWebUsbDevice = event.device;
            this.autodetectSiDevice(navigatorWebUsbDevice)
                .then((openedDevice: WebUsbSiDevice) => {
                    this.dispatchEvent(new SiDeviceAddEvent(openedDevice));
                }, () => {});
        };
        this.navigatorUsb.addEventListener('connect', onConnectCallback);
        const onDisconnectCallback = (event: USBConnectionEvent) => {
            const navigatorWebUsbDevice = event.device;
            const ident = getIdent(navigatorWebUsbDevice);
            const siDevice = this.siDeviceByIdent[ident];
            if (siDevice === undefined) {
                return;
            }
            this.forgetSiDevice(siDevice);
        };
        this.navigatorUsb.addEventListener('disconnect', onDisconnectCallback);
        this.autodetectionCallbacks = {
            onConnect: onConnectCallback,
            onDisconnect: onDisconnectCallback,
        };
    }

    stopAutoDetection(): Promise<unknown> {
        this.deregisterAutodetectionCallbacks();
        return this.closeAutoOpened();
    }

    deregisterAutodetectionCallbacks(): void {
        if (this.autodetectionCallbacks === undefined) {
            return;
        }
        this.navigatorUsb.removeEventListener('connect', this.autodetectionCallbacks.onConnect);
        this.navigatorUsb.removeEventListener('disconnect', this.autodetectionCallbacks.onDisconnect);
        this.autodetectionCallbacks = undefined;
    }

    closeAutoOpened(): Promise<unknown> {
        return Promise.all(
            Object.values(this.autodetectedSiDevices).map(
                (autoOpenedDevice) => autoOpenedDevice.close(),
            ),
        )
            .then(() => {
                this.autodetectedSiDevices = {};
            });
    }

    open(
        device: IWebUsbSiDevice,
    ): Promise<void> {
        console.debug('Opening...');
        const navigatorDevice = device.data.device;
        return navigatorDevice.open()
            .then(() => {
                console.debug('Resetting...');
                return navigatorDevice.reset();
            })
            .then(() => {
                console.debug('Selecting Configuration...');
                return navigatorDevice.selectConfiguration(siConfiguration);
            })
            .then(() => {
                console.debug('Claiming Interface...');
                return navigatorDevice.claimInterface(siInterface);
            })
            .then(() => {
                console.debug('Selection Alternate Interface...');
                return navigatorDevice.selectAlternateInterface(siInterface, siAlternate);
            })
            .then(() => {
                console.debug('Enabling Serial...');
                return navigatorDevice.controlTransferOut({
                    requestType: 'vendor',
                    recipient: 'interface',
                    request: 0x00,
                    value: 0x01,
                    index: siInterface,
                });
            })
            .then(() => {
                console.debug('Setting Baudrate...');
                return navigatorDevice.controlTransferOut({
                    requestType: 'vendor',
                    recipient: 'interface',
                    request: 0x1E,
                    value: 0x00,
                    index: siInterface,
                }, new Uint8Array([0x00, 0x96, 0x00, 0x00]).buffer);
            })
            .then(() => {});
    }

    close(
        device: IWebUsbSiDevice,
    ): Promise<unknown> {
        console.debug('Disabling Serial...');
        const navigatorDevice = device.data.device;
        return navigatorDevice.controlTransferOut({
            requestType: 'vendor',
            recipient: 'interface',
            request: 0x00,
            value: 0x00,
            index: siInterface,
        })
            .then(() => {
                console.debug('Releasing Interface...');
                return navigatorDevice.releaseInterface(siInterface);
            })
            .then(() => {
                console.debug('Closing Device...');
                return navigatorDevice.close();
            })
            .then(() => true);
    }

    receive(
        device: IWebUsbSiDevice,
    ): Promise<number[]> {
        const navigatorDevice = device.data.device;
        if (navigatorDevice.opened !== true) {
            console.warn('Device has been closed. Stopping receive loop.');
            device.setState(SiDeviceState.Closed);
            throw new DeviceClosedError();
        }
        return navigatorDevice.transferIn(siEndpoint, siPacketSize)
            .then((response) => {
                if (!response.data) {
                    return [];
                }
                const uint8Data = new Uint8Array(response.data.buffer);
                return [...uint8Data];
            });
    }

    send(
        device: IWebUsbSiDevice,
        uint8Data: number[],
    ): Promise<unknown> {
        const navigatorDevice = device.data.device;
        const buffer = new Uint8Array(uint8Data);
        return navigatorDevice.transferOut(siEndpoint, buffer)
            .then(() => true);
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
interface WebUsbSiDeviceDriver extends utils.EventTarget<SiDeviceDriverWithAutodetectionEvents<WebUsbSiDeviceDriverData>> {}
utils.applyMixins(WebUsbSiDeviceDriver, [utils.EventTarget]);

export const getWebUsbSiDeviceDriver = (
    navigatorWebUsb: USB,
): WebUsbSiDeviceDriver => new WebUsbSiDeviceDriver(navigatorWebUsb);
