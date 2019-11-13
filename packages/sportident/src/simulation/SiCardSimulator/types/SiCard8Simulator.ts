import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SiCard8, SiCard8StorageDefinition} from '../../../SiCard/types/SiCard8';
import {getSiCard8Examples} from '../../../SiCard/types/siCard8Examples';

export class SiCard8Simulator extends ModernSiCardSimulator {
    static siCardClass = SiCard8;
    static getAllExamples = getSiCard8Examples;

    constructor(storage: (number|undefined)[]|undefined) {
        super(undefined);
        this.storage = new SiCard8StorageDefinition(storage);
    }
}
