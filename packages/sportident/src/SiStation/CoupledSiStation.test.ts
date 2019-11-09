/* eslint-env jasmine */

import * as testUtils from '../testUtils';
import {SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {CoupledSiStation} from './CoupledSiStation';

testUtils.useFakeTimers();

describe('CoupledSiStation', () => {
    it('exists', () => {
        expect(CoupledSiStation).not.toBe(undefined);
        expect(CoupledSiStation.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Remote);
    });
});
