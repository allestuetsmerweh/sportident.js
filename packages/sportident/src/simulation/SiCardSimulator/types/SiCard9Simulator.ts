import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SiCard9, SiCard9StorageDefinition} from '../../../SiCard/types/SiCard9';
import {getSiCard9Examples} from '../../../SiCard/types/siCard9Examples';

export class SiCard9Simulator extends ModernSiCardSimulator {
    static siCardClass = SiCard9;
    static getAllExamples = getSiCard9Examples;

    constructor(storage: (number|undefined)[]|undefined) {
        super(undefined);
        this.storage = new SiCard9StorageDefinition(storage);
    }
}
