import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard10 extends ModernSiCard {
    typeSpecificRead() {
        return this.modernRead();
    }
}
BaseSiCard.registerNumberRange(7000000, 8000000, SiCard10);
