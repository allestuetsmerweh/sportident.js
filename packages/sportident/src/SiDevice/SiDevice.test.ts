import {describe, expect, test} from '@jest/globals';
import * as testUtils from '../testUtils';
import {ISiDeviceDriver} from './ISiDeviceDriver';
import {DeviceClosedError, ISiDeviceDriverData, SiDeviceState, SiDeviceStateChangeEvent} from './ISiDevice';
import {SiDevice} from './SiDevice';

testUtils.useFakeTimers();

function mockDriver(driver: Partial<ISiDeviceDriver<ISiDeviceDriverData<unknown>>>) {
    return driver as unknown as ISiDeviceDriver<ISiDeviceDriverData<unknown>>;
}

describe('SiDevice', () => {
    test('state management', () => {
        const siDevice = new SiDevice('stateManagement', {
            driver: mockDriver({name: 'FakeDriver'}),
        });
        const stateChanges: SiDeviceState[] = [];
        const onStateChange = (e: SiDeviceStateChangeEvent) => {
            stateChanges.push(e.state);
        };
        siDevice.addEventListener('stateChange', onStateChange);
        expect(stateChanges).toEqual([]);
        expect(siDevice.state).toBe(SiDeviceState.Closed);
        siDevice.setState(SiDeviceState.Closed);
        expect(stateChanges).toEqual([]);
        expect(siDevice.state).toBe(SiDeviceState.Closed);
        siDevice.setState(SiDeviceState.Opening);
        expect(stateChanges).toEqual([SiDeviceState.Opening]);
        expect(siDevice.state).toBe(SiDeviceState.Opening);
        siDevice.setState(SiDeviceState.Opened);
        expect(stateChanges).toEqual([SiDeviceState.Opening, SiDeviceState.Opened]);
        expect(siDevice.state).toBe(SiDeviceState.Opened);
        siDevice.removeEventListener('stateChange', onStateChange);
    });
    test('fails opening while opening', (done) => {
        const data = {
            driver: mockDriver({}),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opening);
        siDevice.open().catch(() => done());
    });
    test('fails opening while closing', (done) => {
        let count = 0;
        const siDevice = new SiDevice('receiveLoopFail', {
            driver: mockDriver({
                receive: (_device: unknown) => {
                    if (count > 2) {
                        throw new DeviceClosedError('test');
                    }
                    count += 1;
                    throw new Error('test');
                },
            }),
        });

        siDevice.setState(SiDeviceState.Closing);
        siDevice.open().catch(() => done());
    });
    test('immediately opens when opened', (done) => {
        let count = 0;
        const data = {
            driver: mockDriver({
                receive: (_device: unknown) => {
                    if (count > 2) {
                        throw new DeviceClosedError('test');
                    }
                    count += 1;
                    throw new Error('test');
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opened);
        siDevice.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(siDevice);
                done();
            });
    });
    test('opens when closed', (done) => {
        let opened = false;
        const data = {
            driver: mockDriver({
                open: (_device: unknown) => {
                    opened = true;
                    return Promise.resolve();
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Closed);
        siDevice.open()
            .then((openedDevice) => {
                expect(openedDevice).toBe(siDevice);
                expect(opened).toBe(true);
                done();
            });
    });
    test('opening can fail', (done) => {
        const data = {
            driver: mockDriver({
                open: (_device: unknown) => {
                    throw new Error('test');
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Closed);
        siDevice.open()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    test('opening can reject', (done) => {
        const data = {
            driver: mockDriver({
                open: (_device: unknown) => (
                    Promise.reject(new Error('test'))
                ),
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Closed);
        siDevice.open()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    test('fails closing while opening', (done) => {
        const data = {
            driver: mockDriver({}),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opening);
        siDevice.close().catch(() => done());
    });
    test('fails closing while closing', (done) => {
        const data = {
            driver: mockDriver({}),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Closing);
        siDevice.close().catch(() => done());
    });
    test('immediately closes when closed', (done) => {
        const data = {
            driver: mockDriver({}),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Closed);
        siDevice.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(siDevice);
                done();
            });
    });
    test('closes when opened', (done) => {
        let opened = true;
        const data = {
            driver: mockDriver({
                close: (_device: unknown) => {
                    opened = false;
                    return Promise.resolve();
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opened);
        siDevice.close()
            .then((openedDevice) => {
                expect(openedDevice).toBe(siDevice);
                expect(opened).toBe(false);
                done();
            });
    });
    test('closing can fail', (done) => {
        const data = {
            driver: mockDriver({
                close: (_device: unknown) => {
                    throw new Error('test');
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opened);
        siDevice.close()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    test('closing can reject', (done) => {
        const data = {
            driver: mockDriver({
                close: (_device: unknown) => (
                    Promise.reject(new Error('test'))
                ),
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        siDevice.setState(SiDeviceState.Opened);
        siDevice.close()
            .catch((err) => {
                expect(err.message).toBe('test');
                done();
            });
    });
    test('receiveLoop succeed', async () => {
        let count = 0;
        const data = {
            driver: mockDriver({
                receive: (_device: unknown) => new Promise((resolve) => {
                    if (count > 2) {
                        throw new DeviceClosedError('test');
                    }
                    setTimeout(() => {
                        count += 1;
                        resolve([0x12]);
                    }, 1);
                }),
            }),
        };
        const siDevice = new SiDevice('receiveLoopSucceed', data);

        const received: number[][] = [];
        siDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        siDevice.setState(SiDeviceState.Opened);
        siDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([[0x12]]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(2);
        expect(received).toEqual([[0x12], [0x12]]);
    });
    test('receiveLoop can fail', async () => {
        let count = 0;
        const data = {
            driver: mockDriver({
                receive: (_device: unknown) => {
                    if (count > 2) {
                        throw new DeviceClosedError('test');
                    }
                    count += 1;
                    throw new Error('test');
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFail', data);

        const received: number[][] = [];
        siDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        siDevice.setState(SiDeviceState.Opened);
        siDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(2);
        expect(received).toEqual([]);
    });
    test('receiveLoop can reject', async () => {
        let count = 0;
        const data = {
            driver: mockDriver({
                receive: (_device: unknown) => {
                    if (count > 2) {
                        throw new DeviceClosedError('test');
                    }
                    count += 1;
                    return Promise.reject(new Error('test'));
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopReject', data);

        const received: number[][] = [];
        siDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        siDevice.setState(SiDeviceState.Opened);
        siDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(2);
        expect(received).toEqual([]);
    });
    test('receiveLoop can fail if device closed', async () => {
        let count = 0;
        const data = {
            driver: mockDriver({
                receive: (_device: unknown) => {
                    count += 1;
                    throw new DeviceClosedError('test');
                },
            }),
        };
        const siDevice = new SiDevice('receiveLoopFailIfClosed', data);

        const received: number[][] = [];
        siDevice.addEventListener('receive', (e) => {
            received.push(e.uint8Data);
        });
        siDevice.setState(SiDeviceState.Opened);
        siDevice.receiveLoop();

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(1));
        expect(count).toBe(1);
        expect(received).toEqual([]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(count).toBe(1);
        expect(received).toEqual([]);
    });

    test('can send', async () => {
        const sent: number[][] = [];
        const data = {
            driver: mockDriver({
                send: (_device: unknown, buffer: number[]) => {
                    sent.push(buffer);
                    return Promise.resolve();
                },
            }),
        };
        const siDevice = new SiDevice('canSend', data);

        siDevice.setState(SiDeviceState.Opened);
        siDevice.send([0x34]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(sent).toEqual([[0x34]]);
        siDevice.send([0x56]);

        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(100));
        expect(sent).toEqual([[0x34], [0x56]]);
    });
});
