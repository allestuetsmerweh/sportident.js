/* eslint-env jasmine */

import * as utils from '../utils';
import {BaseSiDevice} from './BaseSiDevice';

describe('getWebUsbSiDevice', () => {
    it('class', () => {
        expect(() => BaseSiDevice.detect()).toThrow(utils.NotImplementedError);
    });
    it('instance', () => {
        const baseSiDevice = new BaseSiDevice();
        expect(() => baseSiDevice.ident).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.open()).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.close()).toThrow(utils.NotImplementedError);
        expect(() => baseSiDevice.send()).toThrow(utils.NotImplementedError);
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
});
