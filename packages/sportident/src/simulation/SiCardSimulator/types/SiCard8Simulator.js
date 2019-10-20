import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SiCard8} from '../../../SiCard/types/SiCard8';
import {getSiCard8Examples} from '../../../SiCard/types/siCard8Examples';

export class SiCard8Simulator extends ModernSiCardSimulator {}
SiCard8Simulator.siCardClass = SiCard8;
SiCard8Simulator.getAllExamples = getSiCard8Examples;
