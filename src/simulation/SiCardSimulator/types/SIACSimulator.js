import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SIAC} from '../../../SiCard/types/SIAC';

export class SIACSimulator extends ModernSiCardSimulator {}
SIACSimulator.siCardClass = SIAC;
