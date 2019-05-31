/* eslint-env jasmine */

import _ from 'lodash';
import * as testUtils from '../testUtils';
import {FakeSiDevice} from './FakeSiDevice';

testUtils.useFakeTimers();

describe('FakeSiDevice', () => {
    it('class', async (done) => {
        const timeState = {};
        FakeSiDevice.startAutoDetection()
            .then((devices) => {
                timeState.startDevices = devices;
            });
        expect(timeState).toEqual({});
        await testUtils.runPromises(1);
        expect(timeState).toEqual({startDevices: []});

        FakeSiDevice.stopAutoDetection()
            .then(() => {
                timeState.stopped = true;
            });
        expect(timeState).toEqual({startDevices: []});
        await testUtils.runPromises(1);
        expect(timeState).toEqual({startDevices: [], stopped: true});
        done();
    });
    it('instances', async (done) => {
        const fakeDevice = new FakeSiDevice('fakeDevice');
        expect(fakeDevice.name).toBe('FakeSiDevice(fakeDevice)');
        expect(fakeDevice.ident).toBe('fakeDevice');

        const timeState = {};
        fakeDevice.open().then((device) => { timeState.open = device; });
        fakeDevice.close().then((device) => { timeState.close = device; });
        fakeDevice.receive().then((device) => { timeState.receive = device; });
        fakeDevice.send().then((device) => { timeState.send = device; });

        await testUtils.runPromises();
        expect(timeState).toEqual({
            open: fakeDevice,
            close: fakeDevice,
            receive: fakeDevice,
            send: fakeDevice,
        });
        done();
    });
    it('complains about duplicate ident', () => {
        new FakeSiDevice('sameIdent');
        expect(() => new FakeSiDevice('sameIdent')).toThrow();
    });
});
