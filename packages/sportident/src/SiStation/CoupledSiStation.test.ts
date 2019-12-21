/* eslint-env jasmine */

import * as testUtils from '../testUtils';
// eslint-disable-next-line no-unused-vars
import {ISiDevice} from '../SiDevice/ISiDevice';
import {SiDevice} from '../SiDevice/SiDevice';
import {SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {CoupledSiStation} from './CoupledSiStation';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

describe('CoupledSiStation', () => {
    it('fromSiDevice', () => {
        const fakeSiDevice = new SiDevice('fromSiDevice', {driver: {name: 'FakeSiDevice'}});
        const myCoupledStation1 = CoupledSiStation.fromSiDevice(fakeSiDevice);
        expect(myCoupledStation1 instanceof CoupledSiStation).toBe(true);
        expect(myCoupledStation1.ident).toBe('Remote-FakeSiDevice-fromSiDevice');
        expect(myCoupledStation1.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Remote);
        const myCoupledStation2 = CoupledSiStation.fromSiDevice(fakeSiDevice);
        expect(myCoupledStation2).toBe(myCoupledStation1);
        expect(myCoupledStation2.ident).toBe('Remote-FakeSiDevice-fromSiDevice');
        expect(myCoupledStation2.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Remote);
    });
    it('fromSiTargetMultiplexer', () => {
        const myTargetMultiplexer = new SiTargetMultiplexer({ident: 'fake-ident'} as ISiDevice<any>);
        const myCoupledStation1 = CoupledSiStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myCoupledStation1 instanceof CoupledSiStation).toBe(true);
        expect(myCoupledStation1.ident).toBe('Remote-fake-ident');
        expect(myCoupledStation1.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Remote);
        const myCoupledStation2 = CoupledSiStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myCoupledStation2).toBe(myCoupledStation1);
        expect(myCoupledStation2.ident).toBe('Remote-fake-ident');
        expect(myCoupledStation2.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Remote);
    });
});
