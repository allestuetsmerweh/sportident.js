/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {FCard} from './FCard';

describe('FCard', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(14000000)).toEqual(FCard);
        expect(BaseSiCard.getTypeByCardNumber(14999999)).toEqual(FCard);
    });
});
