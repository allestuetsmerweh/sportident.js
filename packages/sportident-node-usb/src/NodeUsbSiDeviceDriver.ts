import {webusb} from 'usb';
import * as utils from 'sportident/lib/utils';
import {DeviceClosedError, ISiDevice, ISiDeviceDriverData, SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import {ISiDeviceDriver, ISiDeviceDriverWithDetection, SiDeviceDriverWithAutodetectionEvents} from 'sportident/lib/SiDevice/ISiDeviceDriver';
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

export interface NodeUsbSiDeviceDriverData extends ISiDeviceDriverData<NodeUsbSiDeviceDriver> {
    driver: NodeUsbSiDeviceDriver;
    device: USBDevice;
}

// interface NodeUsbAutodetectionCallbacks {
//     onAttach: utils.EventCallback<utils.IEvent<'attach'>>;
//     onDetach: utils.EventCallback<utils.IEvent<'detach'>>;
// }

export type INodeUsbSiDevice = ISiDevice<NodeUsbSiDeviceDriverData>;
export type NodeUsbSiDevice = SiDevice<NodeUsbSiDeviceDriverData>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class NodeUsbSiDeviceDriver implements
        ISiDeviceDriver<NodeUsbSiDeviceDriverData>,
        ISiDeviceDriverWithDetection<NodeUsbSiDeviceDriverData, []> {
    /* ISiDeviceDriverWithAutodetection<NodeUsbSiDeviceDriverData> */

    public name = 'NodeUSB';

    private siDeviceByIdent:
        {[ident: string]: NodeUsbSiDevice} = {};

    private autodetectedSiDevices:
        {[ident: string]: NodeUsbSiDevice} = {};

    // private autodetectionCallbacks?: NodeUsbAutodetectionCallbacks;

    constructor(
        private nodeUsb: typeof webusb,
    ) {}

    detect(): Promise<NodeUsbSiDevice> {
        return Promise.resolve(
            this.nodeUsb.requestDevice({
                filters: siDeviceFilters,
            }),
        )
            .then((nodeUsbDevice) => {
                if (!nodeUsbDevice) {
                    throw new Error('no device found');
                }
                return this.autodetectSiDevice(nodeUsbDevice);
            });
    }

    getSiDevice(nodeUsbDevice: USBDevice): NodeUsbSiDevice {
        const ident = getIdent(nodeUsbDevice);
        if (this.siDeviceByIdent[ident] !== undefined) {
            return this.siDeviceByIdent[ident];
        }
        const newSiDeviceData: NodeUsbSiDeviceDriverData = {
            driver: this,
            device: nodeUsbDevice,
        };
        const newSiDevice = new SiDevice(ident, newSiDeviceData);
        this.siDeviceByIdent[ident] = newSiDevice;
        return newSiDevice;
    }
    //
    // forgetSiDevice(
    //     siDevice: NodeUsbSiDevice,
    // ) {
    //     const nodeUsbDevice = siDevice.data.device;
    //     const ident = getIdent(nodeUsbDevice);
    //     delete this.siDeviceByIdent[ident];
    //     if (this.autodetectedSiDevices[ident] !== undefined) {
    //         this.dispatchEvent('remove', new SiDeviceRemoveEvent(siDevice));
    //     }
    //     delete this.autodetectedSiDevices[ident];
    // }
    //
    // startAutoDetection(): Promise<INodeUsbSiDevice[]> {
    //     this.registerAutodetectionCallbacks();
    //     return this.getAutodetectedDevices();
    // }
    //
    // getAutodetectedDevices(): Promise<NodeUsbSiDevice[]> {
    //     return this.nodeUsb.getDevices()
    //         .then((nodeUsbDevices: iNodeUsb.NodeUsbDevice[]) => (
    //             this.autodetectSiDevices(nodeUsbDevices)
    //         ));
    // }
    //
    // autodetectSiDevices(
    //     nodeUsbDevices: iNodeUsb.NodeUsbDevice[]
    // ): Promise<NodeUsbSiDevice[]> {
    //     // TODO: Make this easier when Promise.allSettled polyfill is available
    //     return new Promise((resolve) => {
    //         let numSettled = 0;
    //         const devices: NodeUsbSiDevice[] = [];
    //         const onSettled = () => {
    //             numSettled += 1;
    //             if (numSettled === nodeUsbDevices.length) {
    //                 resolve(devices);
    //             }
    //         };
    //         nodeUsbDevices.forEach(
    //             (nodeUsbDevice: iNodeUsb.NodeUsbDevice) => (
    //                 this.autodetectSiDevice(nodeUsbDevice)
    //                     .then((siDevice: NodeUsbSiDevice) => {
    //                         devices.push(siDevice);
    //                         onSettled();
    //                     })
    //                     .catch(() => onSettled())
    //             )
    //         )
    //     });
    // }

    autodetectSiDevice(nodeWebUsbDevice: USBDevice): Promise<NodeUsbSiDevice> {
        if (!matchesSiDeviceFilters(
            nodeWebUsbDevice.vendorId,
            nodeWebUsbDevice.productId,
        )) {
            return Promise.reject(new Error('Not a SI device'));
        }
        const ident = getIdent(nodeWebUsbDevice);
        if (this.autodetectedSiDevices[ident] !== undefined) {
            return Promise.reject(new Error('Duplicate SI device'));
        }
        const siDevice = this.getSiDevice(nodeWebUsbDevice);
        this.autodetectedSiDevices[ident] = siDevice;
        return siDevice.open();
    }

    // registerAutodetectionCallbacks(): void {
    //     if (this.autodetectionCallbacks !== undefined) {
    //         return;
    //     }
    //     const onConnectCallback = (event: iNodeUsb.WebUsbConnectEvent) => {
    //         const nodeUsbDevice = event.device;
    //         this.autodetectSiDevice(nodeUsbDevice)
    //             .then((openedDevice: NodeUsbSiDevice) => {
    //                 this.dispatchEvent('add', new SiDeviceAddEvent(openedDevice));
    //             });
    //     };
    //     this.nodeUsb.addEventListener('connect', onConnectCallback);
    //     const onDisconnectCallback = (event: iNodeUsb.WebUsbDisconnectEvent) => {
    //         const nodeUsbDevice = event.device;
    //         const ident = getIdent(nodeUsbDevice);
    //         const siDevice = this.siDeviceByIdent[ident];
    //         if (siDevice === undefined) {
    //             return;
    //         }
    //         this.forgetSiDevice(siDevice);
    //     };
    //     this.nodeUsb.addEventListener('disconnect', onDisconnectCallback);
    //     this.autodetectionCallbacks = {
    //         onConnect: onConnectCallback,
    //         onDisconnect: onDisconnectCallback,
    //     };
    // }
    //
    // stopAutoDetection(): Promise<unknown> {
    //     this.deregisterAutodetectionCallbacks();
    //     return this.closeAutoOpened();
    // }
    //
    // deregisterAutodetectionCallbacks(): void {
    //     if (this.autodetectionCallbacks === undefined) {
    //         return;
    //     }
    //     this.nodeUsb.removeEventListener('connect', this.autodetectionCallbacks.onConnect);
    //     this.nodeUsb.removeEventListener('disconnect', this.autodetectionCallbacks.onDisconnect);
    //     this.autodetectionCallbacks = undefined;
    // }
    //
    // closeAutoOpened(): Promise<unknown> {
    //     return Promise.all(
    //         Object.values(this.autodetectedSiDevices).map(
    //             (autoOpenedDevice) => autoOpenedDevice.close(),
    //         ),
    //     )
    //         .then(() => {
    //             this.autodetectedSiDevices = {};
    //         });
    // }

    open(device: INodeUsbSiDevice): Promise<unknown> {
        console.debug('Opening...');
        const nodeDevice = device.data.device;
        return nodeDevice.open()
            .then(() => {
                console.debug('Resetting...');
                return nodeDevice.reset();
            })
            .then(() => {
                console.debug('Selecting Configuration...');
                return nodeDevice.selectConfiguration(siConfiguration);
            })
            .then(() => {
                console.debug('Claiming Interface...');
                return nodeDevice.claimInterface(siInterface);
            })
            .then(() => {
                console.debug('Selection Alternate Interface...');
                return nodeDevice.selectAlternateInterface(siInterface, siAlternate);
            })
            .then(() => {
                console.debug('Enabling Serial...');
                return nodeDevice.controlTransferOut({
                    requestType: 'vendor',
                    recipient: 'interface',
                    request: 0x00,
                    value: 0x01,
                    index: siInterface,
                });
            })
            .then(() => {
                console.debug('Setting Baudrate...');
                return nodeDevice.controlTransferOut({
                    requestType: 'vendor',
                    recipient: 'interface',
                    request: 0x1E,
                    value: 0x00,
                    index: siInterface,
                }, new Uint8Array([0x00, 0x96, 0x00, 0x00]).buffer);
            })
            .then(() => true);
    }

    close(
        device: INodeUsbSiDevice,
    ): Promise<unknown> {
        console.debug('Disabling Serial...');
        const nodeDevice = device.data.device;
        return nodeDevice.controlTransferOut({
            requestType: 'vendor',
            recipient: 'interface',
            request: 0x00,
            value: 0x00,
            index: siInterface,
        })
            .then(() => {
                console.debug('Releasing Interface...');
                return nodeDevice.releaseInterface(siInterface);
            })
            .then(() => {
                console.debug('Closing Device...');
                return nodeDevice.close();
            })
            .then(() => true);
    }

    receive(
        device: INodeUsbSiDevice,
    ): Promise<number[]> {
        const nodeDevice = device.data.device;
        if (nodeDevice.opened !== true) {
            console.warn('Device has been closed. Stopping receive loop.');
            device.setState(SiDeviceState.Closed);
            throw new DeviceClosedError();
        }
        return nodeDevice.transferIn(siEndpoint, siPacketSize)
            .then((response) => {
                if (!response.data) {
                    return [];
                }
                const uint8Data = new Uint8Array(response.data.buffer);
                return [...uint8Data];
            });
    }

    send(
        device: INodeUsbSiDevice,
        uint8Data: number[],
    ): Promise<unknown> {
        const nodeDevice = device.data.device;
        const buffer = new Uint8Array(uint8Data);
        return nodeDevice.transferOut(siEndpoint, buffer)
            .then(() => true);
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
interface NodeUsbSiDeviceDriver extends utils.EventTarget<SiDeviceDriverWithAutodetectionEvents<NodeUsbSiDeviceDriverData>> {}
utils.applyMixins(NodeUsbSiDeviceDriver, [utils.EventTarget]);

export const getNodeUsbSiDeviceDriver = (
    nodeWebUsb: typeof webusb,
): NodeUsbSiDeviceDriver => new NodeUsbSiDeviceDriver(nodeWebUsb);
