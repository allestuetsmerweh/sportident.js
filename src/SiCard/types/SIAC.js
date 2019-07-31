import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SIAC extends ModernSiCard {}
BaseSiCard.registerNumberRange(8000000, 9000000, SIAC);
