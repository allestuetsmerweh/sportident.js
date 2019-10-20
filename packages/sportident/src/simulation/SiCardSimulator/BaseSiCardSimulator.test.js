/* eslint-env jasmine */

import * as utils from '../../utils';
import * as testUtils from '../../testUtils';
import {BaseSiCardSimulator} from './BaseSiCardSimulator';
import {SiCard6} from '../../SiCard/types/SiCard6';

testUtils.useFakeTimers();

describe('BaseSiCardSimulator', () => {
    it('exists', () => {
        expect(BaseSiCardSimulator).not.toBe(undefined);
    });
    it('cannot instantiate', () => {
        expect(() => new BaseSiCardSimulator()).toThrow();
    });
    it('complains if methods are not overwritten', () => {
        BaseSiCardSimulator.siCardClass = SiCard6;
        const myBaseSiCardSimulator = new BaseSiCardSimulator();
        BaseSiCardSimulator.siCardClass = undefined;
        expect(() => myBaseSiCardSimulator.handleDetect()).toThrow(utils.NotImplementedError);
        expect(() => myBaseSiCardSimulator.handleRequest()).toThrow(utils.NotImplementedError);
    });
});
