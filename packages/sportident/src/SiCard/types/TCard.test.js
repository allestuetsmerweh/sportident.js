/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {TCard} from './SIAC';

describe('TCard', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(6000000)).toEqual(TCard);
        expect(BaseSiCard.getTypeByCardNumber(6999999)).toEqual(TCard);
    });
});
