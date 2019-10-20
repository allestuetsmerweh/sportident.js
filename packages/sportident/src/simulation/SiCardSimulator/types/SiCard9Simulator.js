import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SiCard9} from '../../../SiCard/types/SiCard9';
import {getSiCard9Examples} from '../../../SiCard/types/siCard9Examples';

export class SiCard9Simulator extends ModernSiCardSimulator {}
SiCard9Simulator.siCardClass = SiCard9;
SiCard9Simulator.getAllExamples = getSiCard9Examples;
