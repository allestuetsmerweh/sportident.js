/* eslint-env jasmine */

import {proto} from '../../constants';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard6} from './SiCard6';

describe('SiCard6', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(500000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(999999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003999)).toEqual(SiCard6);
    });
    it('typeSpecificShouldDetectFromMessage works', () => {
        expect(SiCard6.typeSpecificShouldDetectFromMessage({
            command: proto.cmd.SI6_DET,
            parameters: undefined,
        })).toBe(true);
        expect(SiCard6.typeSpecificShouldDetectFromMessage({
            command: testUtils.getRandomByteExcept([proto.cmd.SI6_DET]),
            parameters: undefined,
        })).toBe(false);
    });
});
