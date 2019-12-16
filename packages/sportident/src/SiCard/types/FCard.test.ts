/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {FCard} from './FCard';

describe('FCard', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(14000000)).toEqual(FCard);
        expect(BaseSiCard.getTypeByCardNumber(14999999)).toEqual(FCard);
    });
    it('is not implemented', (done) => {
        const fCard = new FCard(14000000);
        fCard.read().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
});
