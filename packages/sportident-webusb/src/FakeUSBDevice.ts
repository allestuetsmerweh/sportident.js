import * as utils from 'sportident/lib/utils';

export class FakeUSBDevice implements USBDevice {
    public readonly usbVersionMajor = 1;
    public readonly usbVersionMinor = 1;
    public readonly usbVersionSubminor = 0;
    public readonly deviceClass = 0;
    public readonly deviceSubclass = 0;
    public readonly deviceProtocol = 0;
    public readonly deviceVersionMajor = 1;
    public readonly deviceVersionMinor = 0;
    public readonly deviceVersionSubminor = 0;
    public readonly manufacturerName = undefined;
    public readonly productName = undefined;
    public readonly configuration = undefined;
    public readonly configurations = [];

    public get opened(): boolean {
        return this._opened;
    }

    constructor(
        public readonly serialNumber: string,
        public readonly vendorId: number,
        public readonly productId: number,
        private _opened: boolean = false,
    ) {}

    open(): Promise<void> {
        this._opened = true;
        return Promise.resolve();
    }

    close(): Promise<void> {
        this._opened = false;
        return Promise.resolve();
    }

    forget(): Promise<void> {
        return Promise.resolve();
    }

    reset(): Promise<void> {
        return Promise.resolve();
    }

    selectConfiguration(): Promise<void> {
        return Promise.resolve();
    }

    claimInterface(): Promise<void> {
        return Promise.resolve();
    }

    releaseInterface(): Promise<void> {
        return Promise.resolve();
    }

    selectAlternateInterface(): Promise<void> {
        return Promise.resolve();
    }

    controlTransferIn(
        _setup: USBControlTransferParameters,
        _length: number,
    ): Promise<USBInTransferResult> {
        return Promise.resolve({} as USBInTransferResult);
    }

    controlTransferOut(): Promise<USBOutTransferResult> {
        return Promise.resolve({} as USBOutTransferResult);
    }

    clearHalt(
        _direction: USBDirection,
        _endpointNumber: number,
    ): Promise<void> {
        return Promise.resolve();
    }

    transferIn(): Promise<USBInTransferResult> {
        return utils.waitFor(10)
            .then(() => ({
                data: new DataView(Uint8Array.from([0x01, 0x02, 0x03]).buffer),
            } as USBInTransferResult));
    }

    transferOut(): Promise<USBOutTransferResult> {
        return Promise.resolve({} as USBOutTransferResult);
    }

    isochronousTransferIn(
        _endpointNumber: number,
        _packetLengths: number[],
    ): Promise<USBIsochronousInTransferResult> {
        return Promise.resolve({} as USBIsochronousInTransferResult);
    }

    isochronousTransferOut(
        _endpointNumber: number,
        _data: BufferSource,
        _packetLengths: number[],
    ): Promise<USBIsochronousOutTransferResult> {
        return Promise.resolve({} as USBIsochronousOutTransferResult);
    }
}
