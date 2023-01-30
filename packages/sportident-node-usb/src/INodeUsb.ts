export interface NodeUsbDevice {
    deviceDescriptor: NodeUsbDeviceDescriptor
    opened: boolean;
    open: () => void;
    close: () => void;
    setConfiguration: (configuration: number, callback: (error?: Error) => void) => void;
    interface: (interfaceNumber: number) => NodeUsbDeviceInterface;
    controlTransfer: (
        bmRequestType: number,
        bRequest: number,
        wValue: number,
        wIndex: number,
        dataOrLength: unknown,
        callback: (error?: Error, data?: unknown) => void,
    ) => void;
}

interface NodeUsbDeviceDescriptor {
    idVendor: number;
    idProduct: number;
    iSerialNumber: string;
}

export interface NodeUsbDeviceInterface {
    claim: () => Promise<void>;
    setAltSetting: (alternate: number, callback: (error?: Error) => void) => void;
    endpoint: (address: number) => NodeUsbDeviceEndpoint;
    release: (closeEndpoints: boolean, callback: (error?: Error) => void) => void;
}

interface NodeUsbDeviceEndpoint {
    transfer: (lengthOrData: number|unknown, callback: (error?: unknown, data?: unknown) => void) => void;
}

export const promisify = <ErrorType, DataType>(fn: (check: (error?: ErrorType, data?: DataType) => void) => void): Promise<DataType> => new Promise((resolve, reject) => {
    const check = (error?: ErrorType, data?: DataType) => {
        if (error) {
            reject(error);
        } else if (data === undefined) {
            reject(new Error('no data'));
        } else {
            resolve(data);
        }
    };
    fn(check);
});
