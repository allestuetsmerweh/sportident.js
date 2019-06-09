/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard9} from './SiCard9';

describe('SiCard9', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(1000000)).toEqual(SiCard9);
        expect(BaseSiCard.getTypeByCardNumber(1999999)).toEqual(SiCard9);
    });
});
