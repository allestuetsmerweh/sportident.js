/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {TCard} from './TCard';

describe('TCard', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(5999999)).not.toEqual(TCard);
        expect(BaseSiCard.getTypeByCardNumber(6000000)).toEqual(TCard);
        expect(BaseSiCard.getTypeByCardNumber(6999999)).toEqual(TCard);
        expect(BaseSiCard.getTypeByCardNumber(7000000)).not.toEqual(TCard);
    });
    it('is not implemented', (done) => {
        const tCard = new TCard(6000000);
        tCard.read().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
});
