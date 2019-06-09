/* eslint-env jasmine */

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
});
