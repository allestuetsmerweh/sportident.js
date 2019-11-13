import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SIAC} from '../../../SiCard/types/SIAC';

export class SIACSimulator extends ModernSiCardSimulator {
    static siCardClass = SIAC;
}
