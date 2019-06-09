/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import * as index from './index';

describe('SiCard index', () => {
    it('every card type has been registered', () => {
        const cardTypesInRegistry = BaseSiCard._cardNumberRangeRegistry.values;
        Object.values(index.siCardTypes).forEach((cardType) => {
            expect(cardTypesInRegistry.includes(cardType)).toBe(true);
        });
    });
});
