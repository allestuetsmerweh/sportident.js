import {describe, expect, test} from '@jest/globals';
import {testISiDeviceDriver} from 'sportident/lib/SiDevice/testUtils/testISiDeviceDriver';
import {testISiDeviceDriverWithAutodetection} from 'sportident/lib/SiDevice/testUtils/testISiDeviceDriverWithAutodetection';
import {SiDeviceState} from 'sportident/lib/SiDevice/ISiDevice';
import * as testUtils from 'sportident/lib/testUtils';
import {IWebUsbSiDevice, getWebUsbSiDeviceDriver, WebUsbSiDeviceDriverData} from './WebUsbSiDeviceDriver';
import {FakeUSB} from './FakeUSB';
import {FakeUSBDevice} from './FakeUSBDevice';
import {FakeUSBConnectionEvent} from './FakeUSBConnectionEvent';

testUtils.useFakeTimers();

const siVendorId = 0x10c4;
const siProductId = 0x800a;
const siSerialNumber1 = '1';
const siSerialNumber2 = '3';
const nonSiVendorId = 0x1111;
const nonSiProductId = 0x1112;
const nonSiSerialNumber1 = '2';

export const testUsb = new FakeUSB(
    new FakeUSBDevice(siSerialNumber1, siVendorId, siProductId),
    [
        new FakeUSBDevice(siSerialNumber1, siVendorId, siProductId),
        new FakeUSBDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId),
    ],
) as unknown as USB;

const requestDeviceError = new Error('requestDevice');
const failingTestUsb = {
    requestDevice: () => Promise.reject(requestDeviceError),
} as USB;

describe('WebUsbSiDeviceDriver', () => {
    describe('general', testISiDeviceDriver(
        {
            driver: getWebUsbSiDeviceDriver(testUsb),
            device: new FakeUSBDevice(siSerialNumber1, siVendorId, siProductId),
        } as WebUsbSiDeviceDriverData,
    ));

    const autodetectionDriver = getWebUsbSiDeviceDriver(testUsb);
    describe('autodetection', testISiDeviceDriverWithAutodetection(
        {
            driver: autodetectionDriver,
            device: new FakeUSBDevice(siSerialNumber2, siVendorId, siProductId),
        } as WebUsbSiDeviceDriverData,
        {
            driver: autodetectionDriver,
            device: new FakeUSBDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId),
        } as WebUsbSiDeviceDriverData,
        (data: WebUsbSiDeviceDriverData) => testUsb.dispatchEvent(
            new FakeUSBConnectionEvent('connect', {device: data.device}),
        ),
        (data: WebUsbSiDeviceDriverData) => testUsb.dispatchEvent(
            new FakeUSBConnectionEvent('disconnect', {device: data.device}),
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

        const myWebUsbDevice1 = {serialNumber: '1'} as USBDevice;
        const mySiDevice1 = driver.getSiDevice(myWebUsbDevice1);

        const myOtherWebUsbDevice1 = {serialNumber: '1'} as USBDevice;
        const myOtherSiDevice1 = driver.getSiDevice(myOtherWebUsbDevice1);
        expect(myOtherSiDevice1).toBe(mySiDevice1);

        const myWebUsbDevice2 = {serialNumber: '2'} as USBDevice;
        const mySiDevice2 = driver.getSiDevice(myWebUsbDevice2);
        expect(mySiDevice2).not.toBe(mySiDevice1);
    });
});
