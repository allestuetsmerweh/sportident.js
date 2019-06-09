/* eslint-env jasmine */

import {BaseSiCard} from './BaseSiCard';

describe('BaseSiCard', () => {
    it('registerNumberRange', () => {
        class SiCard1 extends BaseSiCard {}
        class SiCard2 extends BaseSiCard {}
        BaseSiCard.resetNumberRangeRegistry();
        BaseSiCard.registerNumberRange(100, 1000, SiCard1);
        BaseSiCard.registerNumberRange(0, 100, SiCard2);
        BaseSiCard.registerNumberRange(1000, 2000, SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(-1)).toEqual(undefined);
        expect(BaseSiCard.getTypeByCardNumber(0)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(99)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(100)).toEqual(SiCard1);
        expect(BaseSiCard.getTypeByCardNumber(999)).toEqual(SiCard1);
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(1999)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(2000)).toEqual(undefined);
    });
});
