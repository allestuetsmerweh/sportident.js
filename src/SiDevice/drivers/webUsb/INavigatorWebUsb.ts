import * as utils from '../../../utils';

export interface WebUsbConnectEvent extends utils.IEvent<'connect'> {
    device: WebUsbDevice;
    target: any;
    defaultPrevented: boolean;
}

export interface WebUsbDisconnectEvent extends utils.IEvent<'disconnect'> {
    device: WebUsbDevice;
    target: any;
    defaultPrevented: boolean;
}

export type WebUsbEvents = {
    'connect': WebUsbConnectEvent,
    'disconnect': WebUsbDisconnectEvent,
};

export interface WebUsb extends utils.IEventTarget<WebUsbEvents> {
    getDevices: () => Promise<WebUsbDevice[]>;
    requestDevice: (args: RequestDeviceArgs) => Promise<WebUsbDevice>;
}

interface RequestDeviceArgs {
    filters: WebUsbDeviceFilter[];
}

interface WebUsbDeviceFilter {
    vendorId?: number;
    productId?: number;
}

export interface WebUsbDevice {
    serialNumber: string;
    vendorId: number;
    productId: number;
    opened: boolean;
    open: () => Promise<void>;
    close: () => Promise<void>;
    reset: () => Promise<void>;
    selectConfiguration: (configuration: number) => Promise<void>;
    claimInterface: (interfaceNumber: number) => Promise<void>;
    releaseInterface: (interfaceNumber: number) => Promise<void>;
    selectAlternateInterface: (interfaceNumber: number, alternate: number) => Promise<void>;
    transferIn: (endpoint: number, length: number) => Promise<WebUsbTransferInData>;
    transferOut: (endpoint: number, buffer: number[]) => Promise<void>;
    controlTransferOut: (endpoint: WebUsbControlTransferSetup, data?: ArrayBuffer) => Promise<void>;
}

export interface WebUsbTransferInData {
    data?: DataView;
}

interface WebUsbControlTransferSetup {
    recipient: string;
    request: number;
    requestType: string;
    index: number;
    value: number;
}
