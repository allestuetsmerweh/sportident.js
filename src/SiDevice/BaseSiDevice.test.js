/* eslint-env jasmine */

import * as utils from '../utils';
import * as testUtils from '../testUtils';
import {BaseSiDevice} from './BaseSiDevice';

testUtils.useFakeTimers();

beforeEach(() => {
    BaseSiDevice.allByIdent = {};
});

describe('BaseSiDevice', () => {
    it('getSingleton', () => {
        class SiDevice1 extends BaseSiDevice {}
        class SiDevice2 extends BaseSiDevice {}

        const mySiDevice1 = new SiDevice1('1');
        const expectedAllByIdentWithDevice1 = {[mySiDevice1.ident]: mySiDevice1};
        expect(BaseSiDevice.getSingleton(mySiDevice1)).toBe(mySiDevice1);
        expect(BaseSiDevice.allByIdent).toEqual(expectedAllByIdentWithDevice1);
        expect(SiDevice1.allByIdent).toEqual(expectedAllByIdentWithDevice1);
        expect(SiDevice2.allByIdent).toEqual(expectedAllByIdentWithDevice1);

        const myOtherSiDevice1 = new SiDevice1('1');
        expect(BaseSiDevice.getSingleton(myOtherSiDevice1)).toBe(mySiDevice1);
        expect(BaseSiDevice.allByIdent).toEqual(expectedAllByIdentWithDevice1);
        expect(SiDevice1.allByIdent).toEqual(expectedAllByIdentWithDevice1);
        expect(SiDevice2.allByIdent).toEqual(expectedAllByIdentWithDevice1);

        const mySiDevice2 = new SiDevice2('1');
        const expectedAllByIdentWithBothDevices = {
            [mySiDevice1.ident]: mySiDevice1,
            [mySiDevice2.ident]: mySiDevice2,
        };
        expect(BaseSiDevice.getSingleton(mySiDevice2)).toBe(mySiDevice2);
        expect(BaseSiDevice.allByIdent).toEqual(expectedAllByIdentWithBothDevices);
        expect(SiDevice1.allByIdent).toEqual(expectedAllByIdentWithBothDevices);
        expect(SiDevice2.allByIdent).toEqual(expectedAllByIdentWithBothDevices);
    });
    it('override methods', () => {
        expect(() => BaseSiDevice.typeSpecificDetect()).toThrow(utils.NotImplementedError);
        expect(() => BaseSiDevice.getTypeSpecificAutodetectedDevices()).toThrow(utils.NotImplementedError);
        expect(() => BaseSiDevice.registerTypeSpecificAutodetectionCallbacks()).toThrow(utils.NotImplementedError);
        expect(() => BaseSiDevice.deregisterTypeSpecificAutodetectionCallbacks()).toThrow(utils.NotImplementedError);
        const baseSiDevice = new BaseSiDevice();
        expect(() => baseSiDevice.typeSpecificOpen()).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.typeSpecificClose()).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.typeSpecificReceive()).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.typeSpecificSend()).toThrow(utils.NotImplementedError);
    });
    it('state management', () => {
        const onStaticStateChange = () => {
            throw new Error('This should not happen');
        };
        BaseSiDevice.addEventListener('stateChange', onStaticStateChange);
        const baseSiDevice = new BaseSiDevice();
        const stateChanges = [];
        const onStateChange = (e) => stateChanges.push(e.state);
        baseSiDevice.addEventListener('stateChange', onStateChange);
        expect(stateChanges).toEqual([]);
        expect(baseSiDevice.state).toBe(BaseSiDevice.State.Closed);
        baseSiDevice.setSiDeviceState(BaseSiDevice.State.Closed);
        expect(stateChanges).toEqual([]);
        expect(baseSiDevice.state).toBe(BaseSiDevice.State.Closed);
        baseSiDevice.setSiDeviceState(BaseSiDevice.State.Opening);
        expect(stateChanges).toEqual([BaseSiDevice.State.Opening]);
        expect(baseSiDevice.state).toBe(BaseSiDevice.State.Opening);
        baseSiDevice.setSiDeviceState(BaseSiDevice.State.Opened);
        expect(stateChanges).toEqual([BaseSiDevice.State.Opening, BaseSiDevice.State.Opened]);
        expect(baseSiDevice.state).toBe(BaseSiDevice.State.Opened);
        baseSiDevice.removeEventListener('stateChange', onStateChange);
        BaseSiDevice.removeEventListener('stateChange', onStaticStateChange);
    });
    it('detect', async (done) => {
        class SiDevice3 extends BaseSiDevice {
            static typeSpecificDetect() {
                return Promise.resolve(new this('1'));
            }

            typeSpecificOpen() {
                this.opened = true;
                return Promise.resolve(this);
            }
        }
        let openedInstance = null;
        SiDevice3.detect()
            .then((openedInstance_) => {
                openedInstance = openedInstance_;
            });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(openedInstance instanceof SiDevice3).toBe(true);
        expect(openedInstance.ident).toBe('SiDevice3-1');
        expect(openedInstance.opened).toBe(true);
        done();
    });
    it('autoDetect', async (done) => {
        class SiDevice4 extends BaseSiDevice {
            static registerTypeSpecificAutodetectionCallbacks() {
                this.callbacksRegistered = true;
                return {};
            }

            static getTypeSpecificAutodetectedDevices() {
                return Promise.resolve([
                    new this('1'),
                    new this('2'),
                ]);
            }

            static deregisterTypeSpecificAutodetectionCallbacks() {
                this.callbacksRegistered = false;
                return undefined;
            }

            typeSpecificOpen() {
                this.opened = true;
                return Promise.resolve(this);
            }

            typeSpecificClose() {
                this.opened = false;
                return Promise.resolve(this);
            }
        }
        let openedInstances = null;
        SiDevice4.startAutoDetection()
            .then((openedInstances_) => {
                openedInstances = openedInstances_;
            });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(SiDevice4.callbacksRegistered).toBe(true);
        expect(openedInstances.map((openedInstance) => openedInstance instanceof SiDevice4)).toEqual([true, true]);
        expect(openedInstances.map((openedInstance) => openedInstance.ident)).toEqual(['SiDevice4-1', 'SiDevice4-2']);
        expect(openedInstances.map((openedInstance) => openedInstance.opened)).toEqual([true, true]);
        let nextOpenedInstances = null;
        SiDevice4.startAutoDetection()
            .then((openedInstances_) => {
                nextOpenedInstances = openedInstances_;
            });

        await testUtils.nTimesAsync(4, () => testUtils.advanceTimersByTime(0));
        expect(SiDevice4.callbacksRegistered).toBe(true);
        expect(nextOpenedInstances).toEqual(openedInstances);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance instanceof SiDevice4)).toEqual([true, true]);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.ident)).toEqual(['SiDevice4-1', 'SiDevice4-2']);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.opened)).toEqual([true, true]);
        let stopped = false;
        SiDevice4.stopAutoDetection()
            .then(() => {
                stopped = true;
            });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(stopped).toBe(true);
        expect(SiDevice4.callbacksRegistered).toBe(false);
        expect(nextOpenedInstances).toEqual(openedInstances);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance instanceof SiDevice4)).toEqual([true, true]);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.ident)).toEqual(['SiDevice4-1', 'SiDevice4-2']);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.opened)).toEqual([false, false]);
        let stoppedAgain = false;
        SiDevice4.stopAutoDetection()
            .then(() => {
                stoppedAgain = true;
            });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(stoppedAgain).toBe(true);
        expect(SiDevice4.callbacksRegistered).toBe(false);
        expect(nextOpenedInstances).toEqual(openedInstances);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance instanceof SiDevice4)).toEqual([true, true]);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.ident)).toEqual(['SiDevice4-1', 'SiDevice4-2']);
        expect(nextOpenedInstances.map((openedInstance) => openedInstance.opened)).toEqual([false, false]);
        done();
    });
    it('handleAdd', async (done) => {
        class SiDevice5 extends BaseSiDevice {
            typeSpecificOpen() {
                this.opened = true;
                return Promise.resolve(this);
            }
        }
        const mySiDevice1 = new SiDevice5('1');
        const added = [];
        SiDevice5.addEventListener('add', (e) => {
            added.push(e.siDevice);
        });
        SiDevice5.handleAdd(mySiDevice1);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(added).toEqual([mySiDevice1]);
        expect(mySiDevice1.opened).toBe(true);
        SiDevice5.handleAdd(mySiDevice1);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(added).toEqual([mySiDevice1]);
        expect(mySiDevice1.opened).toBe(true);
        done();
    });
    it('handleRemove', async (done) => {
        class SiDevice6 extends BaseSiDevice {}
        const mySiDevice1 = new SiDevice6('1');
        const removed = [];
        SiDevice6.addEventListener('remove', (e) => {
            removed.push(e.siDevice);
        });
        SiDevice6.handleRemove(mySiDevice1);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(removed).toEqual([mySiDevice1]);
        done();
    });
    it('handleRemove', async (done) => {
        class SiDevice7 extends BaseSiDevice {}
        const mySiDevice1 = new SiDevice7('1');
        const removed = [];
        SiDevice7.addEventListener('remove', (e) => {
            removed.push(e.siDevice);
        });
        SiDevice7.handleRemove(mySiDevice1);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(removed).toEqual([mySiDevice1]);
        done();
    });
    it('fails opening while opening', (done) => {
        class SiDevice8 extends BaseSiDevice {}
        const mySiDevice = new SiDevice8('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opening);
        mySiDevice.open().catch(() => done());
    });
    it('fails opening while closing', (done) => {
        class SiDevice9 extends BaseSiDevice {}
        const mySiDevice = new SiDevice9('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closing);
        mySiDevice.open().catch(() => done());
    });
    it('immediately opens when opened', (done) => {
        class SiDeviceA extends BaseSiDevice {}
        const mySiDevice = new SiDeviceA('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(mySiDevice);
                done();
            });
    });
    it('opens when closed', (done) => {
        class SiDeviceB extends BaseSiDevice {
            typeSpecificOpen() {
                this.opened = true;
                return Promise.resolve(this);
            }
        }
        const mySiDevice = new SiDeviceB('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closed);
        mySiDevice.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(mySiDevice);
                expect(openedDevice.opened).toBe(true);
                done();
            });
    });
    it('opening can fail', (done) => {
        class SiDeviceC extends BaseSiDevice {
            typeSpecificOpen() {
                throw new Error('test');
            }
        }
        const mySiDevice = new SiDeviceC('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closed);
        mySiDevice.open()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    it('opening can reject', (done) => {
        class SiDeviceD extends BaseSiDevice {
            typeSpecificOpen() {
                return Promise.reject(new Error('test'));
            }
        }
        const mySiDevice = new SiDeviceD('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closed);
        mySiDevice.open()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    it('fails closing while opening', (done) => {
        class SiDeviceE extends BaseSiDevice {}
        const mySiDevice = new SiDeviceE('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opening);
        mySiDevice.close().catch(() => done());
    });
    it('fails closing while closing', (done) => {
        class SiDeviceF extends BaseSiDevice {}
        const mySiDevice = new SiDeviceF('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closing);
        mySiDevice.close().catch(() => done());
    });
    it('immediately closes when closed', (done) => {
        class SiDeviceG extends BaseSiDevice {}
        const mySiDevice = new SiDeviceG('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Closed);
        mySiDevice.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(mySiDevice);
                done();
            });
    });
    it('closes when opened', (done) => {
        class SiDeviceH extends BaseSiDevice {
            typeSpecificClose() {
                this.opened = false;
                return Promise.resolve(this);
            }
        }
        const mySiDevice = new SiDeviceH('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(mySiDevice);
                expect(openedDevice.opened).toBe(false);
                done();
            });
    });
    it('closing can fail', (done) => {
        class SiDeviceI extends BaseSiDevice {
            typeSpecificClose() {
                throw new Error('test');
            }
        }
        const mySiDevice = new SiDeviceI('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.close()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    it('closing can reject', (done) => {
        class SiDeviceJ extends BaseSiDevice {
            typeSpecificClose() {
                return Promise.reject(new Error('test'));
            }
        }
        const mySiDevice = new SiDeviceJ('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.close()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    it('receiveLoop succeed', async (done) => {
        let count = 0;
        class SiDeviceK extends BaseSiDevice {
            typeSpecificReceive() {
                return new Promise((resolve) => {
                    if (count > 2) {
                        throw new BaseSiDevice.DeviceClosedError('test');
                    }
                    setTimeout(() => {
                        count += 1;
                        resolve([0x12]);
                    }, 1);
                });
            }
        }
        const mySiDevice = new SiDeviceK('1');
        const received = [];
        mySiDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([[0x12]]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(2);
        expect(received).toEqual([[0x12], [0x12]]);
        done();
    });
    it('receiveLoop can fail', async (done) => {
        let count = 0;
        class SiDeviceL extends BaseSiDevice {
            typeSpecificReceive() {
                if (count > 2) {
                    throw new BaseSiDevice.DeviceClosedError('test');
                }
                count += 1;
                throw new Error('test');
            }
        }
        const mySiDevice = new SiDeviceL('1');
        const received = [];
        mySiDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(2);
        expect(received).toEqual([]);
        done();
    });
    it('receiveLoop can reject', async (done) => {
        let count = 0;
        class SiDeviceM extends BaseSiDevice {
            typeSpecificReceive() {
                if (count > 2) {
                    throw new BaseSiDevice.DeviceClosedError('test');
                }
                count += 1;
                return Promise.reject(new Error('test'));
            }
        }
        const mySiDevice = new SiDeviceM('1');
        const received = [];
        mySiDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(2);
        expect(received).toEqual([]);
        done();
    });
    it('receiveLoop can fail if device closed', async (done) => {
        let count = 0;
        class SiDeviceN extends BaseSiDevice {
            typeSpecificReceive() {
                count += 1;
                throw new BaseSiDevice.DeviceClosedError('test');
            }
        }
        const mySiDevice = new SiDeviceN('1');
        const received = [];
        mySiDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(1);
        expect(received).toEqual([]);
        done();
    });
    it('receiveLoop can reject if device closed', async (done) => {
        let count = 0;
        class SiDeviceO extends BaseSiDevice {
            typeSpecificReceive() {
                count += 1;
                return Promise.reject(new BaseSiDevice.DeviceClosedError('test'));
            }
        }
        const mySiDevice = new SiDeviceO('1');
        const received = [];
        mySiDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(1);
        expect(received).toEqual([]);
        done();
    });
    it('can send', async (done) => {
        const sent = [];
        class SiDeviceP extends BaseSiDevice {
            typeSpecificSend(buffer) {
                sent.push(buffer);
                return Promise.resolve();
            }
        }
        const mySiDevice = new SiDeviceP('1');
        mySiDevice.setSiDeviceState(mySiDevice.constructor.State.Opened);
        mySiDevice.send([0x34]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(sent).toEqual([[0x34]]);
        mySiDevice.send([0x56]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(sent).toEqual([[0x34], [0x56]]);
        done();
    });
});
