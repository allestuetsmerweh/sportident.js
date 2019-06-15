/* eslint-env jasmine */

import {proto} from '../../constants';
import * as utils from '../../utils';
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
    it('getTypeSpecificDetectionMessage works', () => {
        const mySiCard6 = new SiCard5(406402);
        expect(mySiCard6.getTypeSpecificDetectionMessage()).toEqual({
            command: proto.cmd.SI5_DET,
            parameters: utils.unPrettyHex('00 04 19 02'), // TODO: check
        });
    });
});
