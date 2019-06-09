/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard8} from './SiCard8';

describe('SiCard8', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(2000000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2002999)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2004000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2999999)).toEqual(SiCard8);
    });
});
