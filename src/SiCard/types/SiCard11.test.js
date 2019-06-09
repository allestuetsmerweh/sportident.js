/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard11} from './SiCard11';

describe('SiCard11', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(9000000)).toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(9999999)).toEqual(SiCard11);
    });
});
