import {describe, expect, test} from '@jest/globals';
import {BaseSiCard} from '../BaseSiCard';
import {FCard} from './FCard';

describe('FCard', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(13999999)).not.toEqual(FCard);
        expect(BaseSiCard.getTypeByCardNumber(14000000)).toEqual(FCard);
        expect(BaseSiCard.getTypeByCardNumber(14999999)).toEqual(FCard);
        expect(BaseSiCard.getTypeByCardNumber(15000000)).not.toEqual(FCard);
    });
    test('is not implemented', (done) => {
        const fCard = new FCard(14000000);
        fCard.read().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
});
