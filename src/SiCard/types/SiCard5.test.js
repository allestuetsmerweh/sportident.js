/* eslint-env jasmine */

import {proto} from '../../constants';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard5} from './SiCard5';

describe('SiCard5', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(9999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(10000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(99999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(100000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(499999)).toEqual(SiCard5);
    });
    it('typeSpecificShouldDetectFromMessage works', () => {
        expect(SiCard5.typeSpecificShouldDetectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: undefined,
        })).toBe(true);
        expect(SiCard5.typeSpecificShouldDetectFromMessage({
            command: testUtils.getRandomByteExcept([proto.cmd.SI5_DET]),
            parameters: undefined,
        })).toBe(false);
    });
});
