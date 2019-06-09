/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard6} from './SiCard6';

describe('SiCard6', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(500000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(999999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003999)).toEqual(SiCard6);
    });
});
