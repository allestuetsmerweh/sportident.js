/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard10} from './SiCard10';

describe('SiCard10', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(7000000)).toEqual(SiCard10);
        expect(BaseSiCard.getTypeByCardNumber(7999999)).toEqual(SiCard10);
    });
});
