import {describe, expect, test} from '@jest/globals';
import {testISiDeviceDriver} from 'sportident/lib/SiDevice/testUtils/testISiDeviceDriver';
import {testISiDeviceDriverWithAutodetection} from 'sportident/lib/SiDevice/testUtils/testISiDeviceDriverWithAutodetection';
import {SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import * as utils from 'sportident/lib/utils';
import * as testUtils from 'sportident/lib/testUtils';
import {IWebUsbSiDevice, getWebUsbSiDeviceDriver, WebUsbSiDeviceDriverData} from './WebUsbSiDeviceDriver';
import * as nav from './INavigatorWebUsb';

testUtils.useFakeTimers();

const siVendorId = 0x10c4;
const siProductId = 0x800a;
const siSerialNumber1 = '1';
const siSerialNumber2 = '3';
const nonSiVendorId = 0x1111;
const nonSiProductId = 0x1112;
const nonSiSerialNumber1 = '2';

class FakeWebUsbDevice implements nav.WebUsbDevice {
    // eslint-disable-next-line no-useless-constructor
    constructor(
                public serialNumber: string,
                public vendorId: number,
                public productId: number,
                public opened: boolean = false,
    // eslint-disable-next-line no-empty-function
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

    controlTransferOut() {
        return Promise.resolve();
    }

    transferOut() {
        return Promise.resolve();
    }

    transferIn() {
        return utils.waitFor(10)
            .then(() => ({data: {buffer: [0x01, 0x02, 0x03]}} as unknown as nav.WebUsbTransferInData));
    }
}

class TestNavigatorUsb implements nav.WebUsb {
    requestDevice(): Promise<nav.WebUsbDevice> {
        return Promise.resolve(
            new FakeWebUsbDevice(siSerialNumber1, siVendorId, siProductId) as nav.WebUsbDevice,
        );
    }

    getDevices(): Promise<nav.WebUsbDevice[]> {
        return Promise.resolve([
            new FakeWebUsbDevice(siSerialNumber1, siVendorId, siProductId) as unknown as nav.WebUsbDevice,
            new FakeWebUsbDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId) as unknown as nav.WebUsbDevice,
        ]);
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TestNavigatorUsb extends utils.EventTarget<nav.WebUsbEvents> {}
utils.applyMixins(TestNavigatorUsb, [utils.EventTarget]);

export const testUsb = new TestNavigatorUsb();

const requestDeviceError = new Error('requestDevice');
const failingTestUsb = {
    requestDevice: () => Promise.reject(requestDeviceError),
} as unknown as nav.WebUsb;

describe('WebUsbSiDeviceDriver', () => {
    describe('general', testISiDeviceDriver(
        {
            driver: getWebUsbSiDeviceDriver(testUsb),
            device: new FakeWebUsbDevice(siSerialNumber1, siVendorId, siProductId) as nav.WebUsbDevice,
        } as WebUsbSiDeviceDriverData,
    ));

    const autodetectionDriver = getWebUsbSiDeviceDriver(testUsb);
    describe('autodetection', testISiDeviceDriverWithAutodetection(
        {
            driver: autodetectionDriver,
            device: new FakeWebUsbDevice(siSerialNumber2, siVendorId, siProductId) as nav.WebUsbDevice,
        } as WebUsbSiDeviceDriverData,
        {
            driver: autodetectionDriver,
            device: new FakeWebUsbDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId) as unknown as nav.WebUsbDevice,
        } as WebUsbSiDeviceDriverData,
        (data: WebUsbSiDeviceDriverData) => testUsb.dispatchEvent(
            'connect',
            {device: data.device} as nav.WebUsbConnectEvent,
        ),
        (data: WebUsbSiDeviceDriverData) => testUsb.dispatchEvent(
            'disconnect',
            {device: data.device} as nav.WebUsbDisconnectEvent,
        ),
    ));

    test('detect success', async () => {
        const driver = getWebUsbSiDeviceDriver(testUsb);
        let detectedSiDevice: IWebUsbSiDevice|undefined = undefined;
        driver.detect().then((siDevice: IWebUsbSiDevice) => {
            detectedSiDevice = siDevice;
        });
        await testUtils.nTimesAsync(8, () => testUtils.advanceTimersByTime(1));
        expect(detectedSiDevice!.state).toBe(SiDeviceState.Opened);
        expect(detectedSiDevice!.data.device.serialNumber).toBe(siSerialNumber1);
        expect(detectedSiDevice!.data.device.vendorId).toBe(siVendorId);
        expect(detectedSiDevice!.data.device.productId).toBe(siProductId);
    });
    test('detect fail', async () => {
        const driver = getWebUsbSiDeviceDriver(failingTestUsb);
        let detectionFailure: Error|undefined = undefined;
        driver.detect().catch((err: Error) => {
            detectionFailure = err;
        });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(detectionFailure).toBe(requestDeviceError);
    });
    test('WebUsbSiDeviceDriver.getSiDevice', () => {
        const driver = getWebUsbSiDeviceDriver(testUsb);

        const myWebUsbDevice1 = {serialNumber: '1'} as nav.WebUsbDevice;
        const mySiDevice1 = driver.getSiDevice(myWebUsbDevice1);

        const myOtherWebUsbDevice1 = {serialNumber: '1'} as nav.WebUsbDevice;
        const myOtherSiDevice1 = driver.getSiDevice(myOtherWebUsbDevice1);
        expect(myOtherSiDevice1).toBe(mySiDevice1);

        const myWebUsbDevice2 = {serialNumber: '2'} as nav.WebUsbDevice;
        const mySiDevice2 = driver.getSiDevice(myWebUsbDevice2);
        expect(mySiDevice2).not.toBe(mySiDevice1);
    });
});
