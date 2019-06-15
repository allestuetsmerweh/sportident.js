import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard11 extends ModernSiCard {
    typeSpecificRead() {
        return this.modernRead();
    }
}
BaseSiCard.registerNumberRange(9000000, 10000000, SiCard11);
