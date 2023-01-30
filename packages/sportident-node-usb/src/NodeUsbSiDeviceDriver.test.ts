import {webusb} from 'usb';
import {describe, expect, test} from '@jest/globals';
import {testISiDeviceDriver} from 'sportident/lib/SiDevice/testUtils/testISiDeviceDriver';
import {SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import * as utils from 'sportident/lib/utils';
import * as testUtils from 'sportident/lib/testUtils';
import {INodeUsbSiDevice, getNodeUsbSiDeviceDriver, NodeUsbSiDeviceDriverData} from './NodeUsbSiDeviceDriver';

testUtils.useFakeTimers();

const siVendorId = 0x10c4;
const siProductId = 0x800a;
const siSerialNumber1 = '1';
const nonSiVendorId = 0x1111;
const nonSiProductId = 0x1112;
const nonSiSerialNumber1 = '2';

class FakeNodeUsbDevice implements Partial<USBDevice> {
    constructor(
        public serialNumber: string,
        public vendorId: number,
        public productId: number,
        public opened: boolean = false,
    ) {}

    open(): Promise<void> {
        this.opened = true;
        return Promise.resolve();
    }

    close(): Promise<void> {
        this.opened = false;
        return Promise.resolve();
    }

    reset() {
        return Promise.resolve();
    }

    selectConfiguration() {
        return Promise.resolve();
    }

    claimInterface() {
        return Promise.resolve();
    }

    releaseInterface() {
        return Promise.resolve();
    }

    selectAlternateInterface() {
        return Promise.resolve();
    }

    controlTransferOut(): Promise<USBOutTransferResult> {
        return Promise.resolve({bytesWritten: 0, status: 'ok'});
    }

    transferOut(): Promise<USBOutTransferResult> {
        return Promise.resolve({bytesWritten: 0, status: 'ok'});
    }

    transferIn(): Promise<USBInTransferResult> {
        return utils.waitFor(10)
            .then(() => ({data: {buffer: [0x01, 0x02, 0x03]}} as unknown as USBInTransferResult));
    }
}

const testUsb: Partial<typeof webusb> = {
    requestDevice: (): Promise<USBDevice> => Promise.resolve(
            new FakeNodeUsbDevice(siSerialNumber1, siVendorId, siProductId) as unknown as USBDevice,
    ),
    getDevices: (): Promise<USBDevice[]> => Promise.resolve([
            new FakeNodeUsbDevice(siSerialNumber1, siVendorId, siProductId) as unknown as USBDevice,
            new FakeNodeUsbDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId) as unknown as USBDevice,
    ]),
};

const requestDeviceError = new Error('requestDevice');
const failingTestUsb: Partial<typeof webusb> = {
    requestDevice: () => Promise.reject(requestDeviceError),
};

describe('NodeUsbSiDeviceDriver', () => {
    describe('general', testISiDeviceDriver(
        {
            driver: getNodeUsbSiDeviceDriver(testUsb as typeof webusb),
            device: new FakeNodeUsbDevice(siSerialNumber1, siVendorId, siProductId) as unknown as USBDevice,
        } as NodeUsbSiDeviceDriverData,
    ));
    test('detect success', async () => {
        const driver = getNodeUsbSiDeviceDriver(testUsb as typeof webusb);
        let detectedSiDevice: INodeUsbSiDevice|undefined = undefined;
        driver.detect().then((siDevice: INodeUsbSiDevice) => {
            detectedSiDevice = siDevice;
        });
        await testUtils.nTimesAsync(8, () => testUtils.advanceTimersByTime(1));
        expect(detectedSiDevice!.state).toBe(SiDeviceState.Opened);
        expect(detectedSiDevice!.data.device.serialNumber).toBe(siSerialNumber1);
        expect(detectedSiDevice!.data.device.vendorId).toBe(siVendorId);
        expect(detectedSiDevice!.data.device.productId).toBe(siProductId);
    });
    test('detect fail', async () => {
        const driver = getNodeUsbSiDeviceDriver(failingTestUsb as typeof webusb);
        let detectionFailure: Error|undefined = undefined;
        driver.detect().catch((err: Error) => {
            detectionFailure = err;
        });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(detectionFailure).toBe(requestDeviceError);
    });
    test('NodeUsbSiDeviceDriver.getSiDevice', () => {
        const driver = getNodeUsbSiDeviceDriver(testUsb as typeof webusb);

        const myNodeUsbDevice1 = {serialNumber: '1'} as USBDevice;
        const mySiDevice1 = driver.getSiDevice(myNodeUsbDevice1);

        const myOtherNodeUsbDevice1 = {serialNumber: '1'} as USBDevice;
        const myOtherSiDevice1 = driver.getSiDevice(myOtherNodeUsbDevice1);
        expect(myOtherSiDevice1).toBe(mySiDevice1);

        const myNodeUsbDevice2 = {serialNumber: '2'} as USBDevice;
        const mySiDevice2 = driver.getSiDevice(myNodeUsbDevice2);
        expect(mySiDevice2).not.toBe(mySiDevice1);
    });
});
