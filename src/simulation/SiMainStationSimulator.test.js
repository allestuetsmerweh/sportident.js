/* eslint-env jasmine */

import * as testUtils from '../testUtils';
import {SiMainStationSimulator} from './SiMainStationSimulator';

testUtils.useFakeTimers();

describe('SiMainStationSimulator', () => {
    it('exists', () => {
        expect(SiMainStationSimulator).not.toBe(undefined);
    });
});
