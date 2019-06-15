/* eslint-env jasmine */

import {proto} from '../../constants';
import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard6} from './SiCard6';

describe('SiCard6', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(500000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(999999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003999)).toEqual(SiCard6);
    });
    it('getTypeSpecificDetectionMessage works', () => {
        const mySiCard6 = new SiCard6(500029);
        expect(mySiCard6.getTypeSpecificDetectionMessage()).toEqual({
            command: proto.cmd.SI6_DET,
            parameters: utils.unPrettyHex('00 07 A1 3D'), // TODO: check
        });
    });
});
