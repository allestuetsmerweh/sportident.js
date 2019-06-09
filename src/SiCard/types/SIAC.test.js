/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SIAC} from './SIAC';

describe('SIAC', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(8000000)).toEqual(SIAC);
        expect(BaseSiCard.getTypeByCardNumber(8999999)).toEqual(SIAC);
    });
});
