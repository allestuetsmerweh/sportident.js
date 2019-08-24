/* eslint-env jasmine */

import {BaseSiDevice} from '../BaseSiDevice';
import {getWebUsbSiDeviceClass} from './WebUsbSiDevice';
import * as utils from '../../utils';
import * as testUtils from '../../testUtils';

testUtils.useFakeTimers();

beforeEach(() => {
    BaseSiDevice.allByIdent = {};
});

const siVendorId = 0x10c4;
const siProductId = 0x800a;
const siSerialNumber1 = 1;
const siSerialNumber2 = 3;
const nonSiVendorId = 0x1111;
const nonSiProductId = 0x1112;
const nonSiSerialNumber1 = 2;
const nonSiSerialNumber2 = 4;

class FakeWebUsbDevice {
    constructor(serialNumber, vendorId, productId) {
        this.serialNumber = serialNumber;
        this.vendorId = vendorId;
        this.productId = productId;
        this.opened = false;
    }

    open() {
        this.opened = true;
        return Promise.resolve(this);
    }

    close() {
        this.opened = false;
        return Promise.resolve(this);
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
            .then(() => ({data: {buffer: [0x00]}}));
    }
}

const testNavigatorEventListeners = {};
export const testNavigator = {
    usb: {
        requestDevice: () => Promise.resolve(
            new FakeWebUsbDevice(siSerialNumber1, siVendorId, siProductId),
        ),
        getDevices: () => Promise.resolve([
            new FakeWebUsbDevice(siSerialNumber1, siVendorId, siProductId),
            new FakeWebUsbDevice(nonSiSerialNumber1, nonSiVendorId, nonSiProductId),
        ]),
        addEventListener: (type, callback) => utils.addEventListener(testNavigatorEventListeners, type, callback),
        removeEventListener: (type, callback) => utils.removeEventListener(testNavigatorEventListeners, type, callback),
    },
};
const testNavigatorDispatchEvent = (type, args) => utils.dispatchEvent(testNavigatorEventListeners, type, args);
const WebUsbSiDevice = getWebUsbSiDeviceClass(testNavigator);
const getFakeSiUsbDevice = () => new FakeWebUsbDevice(siSerialNumber2, siVendorId, siProductId);
const getFakeNonSiUsbDevice = () => new FakeWebUsbDevice(nonSiSerialNumber2, nonSiVendorId, nonSiProductId);
const getSiDevice = () => {
    const fakeSiDevice = getFakeSiUsbDevice();
    return new WebUsbSiDevice(fakeSiDevice);
};

const requestDeviceError = new Error('requestDevice');
const failingTestNavigator = {
    usb: {
        requestDevice: () => Promise.reject(requestDeviceError),
    },
};
const FailingWebUsbSiDevice = getWebUsbSiDeviceClass(failingTestNavigator);

describe('getWebUsbSiDeviceClass', () => {
    it('incompatible browser', () => {
        expect(getWebUsbSiDeviceClass({})).toBe(null);
    });
    it('detect', (done) => {
        WebUsbSiDevice.detect()
            .then((result) => {
                expect(result instanceof WebUsbSiDevice).toBe(true);
                expect(result.state).toBe(WebUsbSiDevice.State.Opened);
                expect(result.webUsbDevice.serialNumber).toBe(siSerialNumber1);
                expect(result.webUsbDevice.vendorId).toBe(siVendorId);
                expect(result.webUsbDevice.productId).toBe(siProductId);
                done();
            });
    });
    it('detect fail', (done) => {
        FailingWebUsbSiDevice.detect()
            .then(
                undefined,
                (error) => {
                    expect(error).toBe(requestDeviceError);
                    done();
                },
            );
    });
    it('autodetection', async (done) => {
        let numAddCalled = 0;
        let numRemoveCalled = 0;
        WebUsbSiDevice.addEventListener('add', () => numAddCalled++);
        WebUsbSiDevice.addEventListener('remove', () => numRemoveCalled++);

        const fakeSiDevice = getFakeSiUsbDevice();
        const fakeNonSiDevice = getFakeNonSiUsbDevice();

        testNavigatorDispatchEvent('connect');

        await testUtils.advanceTimersByTime(0);
        expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);
        testNavigatorDispatchEvent('disconnect');

        await testUtils.advanceTimersByTime(0);
        expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);

        const initialDevices = await WebUsbSiDevice.startAutoDetection();
        expect(initialDevices.length).toBe(1);
        expect(initialDevices[0] instanceof WebUsbSiDevice).toBe(true);
        expect(initialDevices[0].state).toBe(WebUsbSiDevice.State.Opened);
        expect(initialDevices[0].ident in WebUsbSiDevice._autoOpened).toBe(true);
        expect(initialDevices[0].webUsbDevice.serialNumber).toBe(siSerialNumber1);
        expect(initialDevices[0].webUsbDevice.vendorId).toBe(siVendorId);
        expect(initialDevices[0].webUsbDevice.productId).toBe(siProductId);
        testNavigatorDispatchEvent('connect', {device: fakeSiDevice});

        await testUtils.nTimesAsync(7, () => testUtils.advanceTimersByTime(0));
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 0]);
        testNavigatorDispatchEvent('disconnect', {device: fakeSiDevice});

        await testUtils.advanceTimersByTime(0);
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
        testNavigatorDispatchEvent('connect', {device: fakeNonSiDevice});

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
        testNavigatorDispatchEvent('disconnect', {device: fakeNonSiDevice});

        await testUtils.advanceTimersByTime(0);
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
        testNavigatorDispatchEvent('connect', {device: fakeSiDevice});

        await testUtils.nTimesAsync(7, () => testUtils.advanceTimersByTime(0));
        expect([numAddCalled, numRemoveCalled]).toEqual([2, 1]);
        testNavigatorDispatchEvent('disconnect', {device: fakeSiDevice});

        await testUtils.advanceTimersByTime(0);
        expect([numAddCalled, numRemoveCalled]).toEqual([2, 2]);
        Object.values(WebUsbSiDevice.allByIdent).forEach((device) => {
            expect(device.state).toBe(WebUsbSiDevice.State.Opened);
        });

        await WebUsbSiDevice.stopAutoDetection();
        done();
    });
    it('opens when closed', (done) => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Closed);
        device.webUsbDevice.opened = false;
        device.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(device);
                expect(openedDevice.webUsbDevice.opened).toBe(true);
                done();
            });
    });
    it('closes when opened', (done) => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Opened);
        device.webUsbDevice.opened = true;
        device.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(device);
                expect(openedDevice.webUsbDevice.opened).toBe(false);
                done();
            });
    });
    it('instance', async (done) => {
        const fakeWebUsbDevice = new FakeWebUsbDevice(74123874, siVendorId, siProductId);
        fakeWebUsbDevice.opened = true;
        const instance = new WebUsbSiDevice(fakeWebUsbDevice);
        let receivedUint8Data = null;
        instance.receive()
            .then((uint8Data) => {
                receivedUint8Data = uint8Data;
            });
        await testUtils.advanceTimersByTime(10);
        expect([...receivedUint8Data]).toEqual([0x00]);
        instance.send([0x00]);
        done();
    });
});
