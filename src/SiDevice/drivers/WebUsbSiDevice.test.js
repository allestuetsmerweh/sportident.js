/* eslint-env jasmine */

import {getWebUsbSiDevice} from './WebUsbSiDevice';
import * as utils from '../../utils';

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
        return new Promise((resolve) => {
            setTimeout(() => resolve({data: {buffer: []}}), 10);
        });
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
const getFakeSiUsbDevice = () => new FakeWebUsbDevice(siSerialNumber2, siVendorId, siProductId);
const getFakeNonSiUsbDevice = () => new FakeWebUsbDevice(nonSiSerialNumber2, nonSiVendorId, nonSiProductId);
const getSiDevice = () => {
    const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
    const fakeSiDevice = getFakeSiUsbDevice();
    return new WebUsbSiDevice(fakeSiDevice);
};

const requestDeviceError = new Error('requestDevice');
const failingTestNavigator = {
    usb: {
        requestDevice: () => Promise.reject(requestDeviceError),
    },
};

describe('getWebUsbSiDevice', () => {
    it('incompatible browser', () => {
        expect(getWebUsbSiDevice({})).toBe(null);
    });
    it('detect', (done) => {
        const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
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
        const WebUsbSiDevice = getWebUsbSiDevice(failingTestNavigator);
        WebUsbSiDevice.detect()
            .then(
                undefined,
                (error) => {
                    expect(error).toBe(requestDeviceError);
                    done();
                },
            );
    });
    it('autodetection', (done) => {
        const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
        let numAddCalled = 0;
        let numRemoveCalled = 0;
        WebUsbSiDevice.addEventListener('add', () => numAddCalled++);
        WebUsbSiDevice.addEventListener('remove', () => numRemoveCalled++);

        const fakeSiDevice = getFakeSiUsbDevice();
        const fakeNonSiDevice = getFakeNonSiUsbDevice();

        testNavigatorDispatchEvent('connect');
        utils.waitFor(0)
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);
                testNavigatorDispatchEvent('disconnect');
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);
                return WebUsbSiDevice.startAutoDetection();
            })
            .then((initialDevices) => {
                expect(initialDevices.length).toBe(1);
                expect(initialDevices[0] instanceof WebUsbSiDevice).toBe(true);
                expect(initialDevices[0].state).toBe(WebUsbSiDevice.State.Opened);
                // expect(initialDevices[0].webUsbDevice.serialNumber in WebUsbSiDevice._autoOpened).toBe(true);
                expect(initialDevices[0].webUsbDevice.serialNumber).toBe(siSerialNumber1);
                expect(initialDevices[0].webUsbDevice.vendorId).toBe(siVendorId);
                expect(initialDevices[0].webUsbDevice.productId).toBe(siProductId);

                testNavigatorDispatchEvent('connect', {device: fakeSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([1, 0]);
                testNavigatorDispatchEvent('disconnect', {device: fakeSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
                testNavigatorDispatchEvent('connect', {device: fakeNonSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
                testNavigatorDispatchEvent('disconnect', {device: fakeNonSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);
                testNavigatorDispatchEvent('connect', {device: fakeSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([2, 1]);
                testNavigatorDispatchEvent('disconnect', {device: fakeSiDevice});
                return utils.waitFor(0);
            })
            .then(() => {
                expect([numAddCalled, numRemoveCalled]).toEqual([2, 2]);
                Object.values(WebUsbSiDevice.allByIdent).forEach((device) => {
                    expect(device.state).toBe(WebUsbSiDevice.State.Opened);
                });
                return WebUsbSiDevice.stopAutoDetection();
            })
            // .then(() => {
            //     Object.values(WebUsbSiDevice.allByIdent).forEach((device) => {
            //         expect(device.state).toBe(WebUsbSiDevice.State.Closed);
            //     });
            //     testNavigatorDispatchEvent('connect', {device: fakeSiDevice});
            //     return utils.waitFor(0);
            // })
            // .then(() => {
            //     expect([numAddCalled, numRemoveCalled]).toEqual([2, 2]);
            //     testNavigatorDispatchEvent('disconnect', {device: fakeSiDevice});
            //     return utils.waitFor(0);
            // })
            .then(() => {
                // expect([numAddCalled, numRemoveCalled]).toEqual([2, 2]);

                done();
            });
    });
    it('getOrCreate', () => {
        const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
        expect('1' in WebUsbSiDevice.allByIdent).toBe(false);
        expect('2' in WebUsbSiDevice.allByIdent).toBe(false);
        const result1 = WebUsbSiDevice.getOrCreate({serialNumber: 1, test: 1});
        expect('1' in WebUsbSiDevice.allByIdent).toBe(true);
        expect('2' in WebUsbSiDevice.allByIdent).toBe(false);
        const result2 = WebUsbSiDevice.getOrCreate({serialNumber: 1, test: 2});
        expect('1' in WebUsbSiDevice.allByIdent).toBe(true);
        expect('2' in WebUsbSiDevice.allByIdent).toBe(false);
        const result3 = WebUsbSiDevice.getOrCreate({serialNumber: 2, test: 1});
        expect('1' in WebUsbSiDevice.allByIdent).toBe(true);
        expect('2' in WebUsbSiDevice.allByIdent).toBe(true);
        expect(result2).toBe(result1);
        expect(result3).not.toBe(result1);
    });
    it('remove', () => {
        const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
        const device1 = WebUsbSiDevice.getOrCreate({serialNumber: 1});
        expect('1' in WebUsbSiDevice.allByIdent).toBe(true);
        WebUsbSiDevice.remove(device1);
        expect('1' in WebUsbSiDevice.allByIdent).toBe(false);
        const device2 = WebUsbSiDevice.getOrCreate({serialNumber: 1});
        expect('1' in WebUsbSiDevice.allByIdent).toBe(true);
        expect(device2).not.toBe(device1);
    });
    it('fails opening while opening', () => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Opening);
        expect(() => device.open()).toThrow();
    });
    it('fails opening while closing', () => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Closing);
        expect(() => device.open()).toThrow();
    });
    it('immediately opens when opened', (done) => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Opened);
        device.webUsbDevice.opened = false; // just to check that the fake open has not been called
        device.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(device);
                expect(openedDevice.webUsbDevice.opened).toBe(false); // the fake open function hasn't actually been called
                done();
            });
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
    it('fails closing while opening', () => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Opening);
        expect(() => device.close()).toThrow();
    });
    it('fails closing while closing', () => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Closing);
        expect(() => device.close()).toThrow();
    });
    it('immediately closes when closed', (done) => {
        const device = getSiDevice();
        device.setSiDeviceState(device.constructor.State.Closed);
        device.webUsbDevice.opened = true; // just to check that the fake close has not been called
        device.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(device);
                expect(openedDevice.webUsbDevice.opened).toBe(true); // the fake close function hasn't actually been called
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
    it('instance', (done) => {
        utils.waitFor(100)
            .then(() => {
                const WebUsbSiDevice = getWebUsbSiDevice(testNavigator);
                const fakeWebUsbDevice = new FakeWebUsbDevice(74123874, siVendorId, siProductId);
                fakeWebUsbDevice.opened = true;
                const instance = new WebUsbSiDevice(fakeWebUsbDevice);
                instance.receive()
                    .then((...args) => {
                        console.log(args);
                        done();
                    });
            });
    });
});
