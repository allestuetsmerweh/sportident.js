import usb from 'usb';
import * as utils from 'sportident/lib/utils';
import {DeviceClosedError, ISiDevice, ISiDeviceDriverData, SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import {ISiDeviceDriver, ISiDeviceDriverWithDetection, SiDeviceDriverWithAutodetectionEvents} from 'sportident/lib/SiDevice/ISiDeviceDriver';
import {SiDevice} from 'sportident/lib/SiDevice/SiDevice';
import * as iNodeUsb from './INodeUsb';

const siConfiguration = 1;
const siInterface = 0;
const siAlternate = 0;
const siEndpointIn = 129;
const siEndpointOut = 1;
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

const directionIsOut = 0x00;
const typeIsVendor = 0x40;
const recipientIsInterface = 0x01;
const vendorInterfaceOut = directionIsOut | typeIsVendor | recipientIsInterface;

const getIdent = (device: iNodeUsb.NodeUsbDevice) => `${device.deviceDescriptor.iSerialNumber}`;

export interface NodeUsbSiDeviceDriverData extends ISiDeviceDriverData<NodeUsbSiDeviceDriver> {
    driver: NodeUsbSiDeviceDriver;
    device: iNodeUsb.NodeUsbDevice;
    interface?: iNodeUsb.NodeUsbDeviceInterface;
}

// interface NodeUsbAutodetectionCallbacks {
//     onAttach: utils.EventCallback<utils.IEvent<'attach'>>;
//     onDetach: utils.EventCallback<utils.IEvent<'detach'>>;
// }

export type INodeUsbSiDevice = ISiDevice<NodeUsbSiDeviceDriverData>;
export type NodeUsbSiDevice = SiDevice<NodeUsbSiDeviceDriverData>;

class NodeUsbSiDeviceDriver implements
        ISiDeviceDriver<NodeUsbSiDeviceDriverData>,
        ISiDeviceDriverWithDetection<NodeUsbSiDeviceDriverData, []> {
    /* ISiDeviceDriverWithAutodetection<NodeUsbSiDeviceDriverData> */
    static singleton?: NodeUsbSiDeviceDriver;
    static getSingleton(): NodeUsbSiDeviceDriver {
        if (!this.singleton) {
            this.singleton = new this(usb);
        }
        return this.singleton;
    }

    public name = 'NodeUSB';

    private siDeviceByIdent:
        {[ident: string]: NodeUsbSiDevice} = {};

    private autodetectedSiDevices:
        {[ident: string]: NodeUsbSiDevice} = {};

    // private autodetectionCallbacks?: NodeUsbAutodetectionCallbacks;

    // eslint-disable-next-line no-useless-constructor
    constructor(
                private nodeUsb: any,
    // eslint-disable-next-line no-empty-function
    ) {}

    detect(): Promise<NodeUsbSiDevice> {
        return Promise.resolve(
            this.nodeUsb.findByIds(
                siDeviceFilters[0].vendorId,
                siDeviceFilters[0].productId,
            ),
        )
            .then((nodeUsbDevice: iNodeUsb.NodeUsbDevice|undefined) => {
                if (!nodeUsbDevice) {
                    throw new Error('no device found');
                }
                return this.autodetectSiDevice(nodeUsbDevice);
            });
    }

    getSiDevice(
        nodeUsbDevice: iNodeUsb.NodeUsbDevice,
    ): NodeUsbSiDevice {
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

    autodetectSiDevice(
        nodeUsbDevice: iNodeUsb.NodeUsbDevice,
    ): Promise<NodeUsbSiDevice> {
        if (!matchesSiDeviceFilters(
            nodeUsbDevice.deviceDescriptor.idVendor,
            nodeUsbDevice.deviceDescriptor.idProduct,
        )) {
            return Promise.reject(new Error('Not a SI device'));
        }
        const ident = getIdent(nodeUsbDevice);
        if (this.autodetectedSiDevices[ident] !== undefined) {
            return Promise.reject(new Error('Duplicate SI device'));
        }
        const siDevice = this.getSiDevice(nodeUsbDevice);
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
    // stopAutoDetection(): Promise<any> {
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
    // closeAutoOpened(): Promise<any> {
    //     return Promise.all(
    //         Object.values(this.autodetectedSiDevices).map(
    //             (autoOpenedDevice) => autoOpenedDevice.close(),
    //         ),
    //     )
    //         .then(() => {
    //             this.autodetectedSiDevices = {};
    //         });
    // }

    open(
        device: INodeUsbSiDevice,
    ): Promise<any> {
        return Promise.resolve(device.data.device.open())
            .then(() => (
                iNodeUsb.promisify((callback) => (
                    device.data.device.setConfiguration(siConfiguration, callback)
                ))
            ))
            .then(() => (
                device.data.device.interface(siInterface)
            ))
            .then((usbInterface: iNodeUsb.NodeUsbDeviceInterface) => {
                device.data.interface = usbInterface;
                return device.data.interface.claim();
            })
            .then(() => (
                iNodeUsb.promisify((callback) => (
                    device.data.interface!.setAltSetting(siAlternate, callback)
                ))
            ))
            .then(() => (
                iNodeUsb.promisify((callback) => (
                    device.data.device.controlTransfer(
                        vendorInterfaceOut,
                        0x00, // request
                        0x01, // value
                        siInterface, // index
                        Buffer.from([]), // data
                        callback,
                    )
                ))
            ))
            .then(() => (
                iNodeUsb.promisify((callback) => (
                    device.data.device.controlTransfer(
                        vendorInterfaceOut,
                        0x1E, // request
                        0x00, // value
                        siInterface, // index
                        Buffer.from([0x00, 0x96, 0x00, 0x00]), // data
                        callback,
                    )
                ))
            ))
            .then(() => true);
    }

    close(
        device: INodeUsbSiDevice,
    ): Promise<any> {
        return iNodeUsb.promisify((callback) => (
            device.data.device.controlTransfer(
                vendorInterfaceOut,
                0x00, // request
                0x00, // value
                siInterface, // index
                Buffer.from([]), // data
                callback,
            )
        ))
            .then(() => {
                console.debug('Releasing Interface...');
                return iNodeUsb.promisify((callback) => (
                    device.data.interface!.release(true, callback)
                ));
            })
            .then(() => {
                console.debug('Closing Device...');
                return device.data.device.close();
            })
            .then(() => true);
    }

    receive(
        device: INodeUsbSiDevice,
    ): Promise<number[]> {
        const usbInterface = device.data.interface;
        if (!usbInterface) {
            throw new DeviceClosedError();
        }
        return iNodeUsb.promisify(
            (callback) => usbInterface
                .endpoint(siEndpointIn)
                .transfer(siPacketSize, callback),
        )
            .then((data: any) => {
                const uint8Data = new Uint8Array(
                    data.buffer,
                    data.byteOffset,
                    data.length,
                );
                return [...uint8Data];
            })
            .catch((err: any) => {
                // TODO: Act differently based on error.
                // Here, we just assume the device was disconnected.
                console.warn('Device has been closed. Stopping receive loop.', err);
                device.setState(SiDeviceState.Closed);
                throw new DeviceClosedError();
            });
    }

    send(
        device: INodeUsbSiDevice,
        buffer: number[],
    ): Promise<any> {
        return iNodeUsb.promisify(
            (callback) => device.data.interface!
                .endpoint(siEndpointOut)
                .transfer(Buffer.from(buffer), callback),
        )
            .then(() => true);
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface NodeUsbSiDeviceDriver extends utils.EventTarget<SiDeviceDriverWithAutodetectionEvents<NodeUsbSiDeviceDriverData>> {}
utils.applyMixins(NodeUsbSiDeviceDriver, [utils.EventTarget]);

export const getNodeUsbSiDeviceDriver = (): NodeUsbSiDeviceDriver => (
    NodeUsbSiDeviceDriver.getSingleton()
);
