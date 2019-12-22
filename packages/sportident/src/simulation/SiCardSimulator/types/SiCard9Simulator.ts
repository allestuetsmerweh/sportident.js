// eslint-disable-next-line no-unused-vars
import * as storage from '../../../storage';
import {ModernSiCardSimulator} from './ModernSiCardSimulator';
// eslint-disable-next-line no-unused-vars
import {ISiCard9StorageFields, SiCard9, siCard9StorageDefinition} from '../../../SiCard/types/SiCard9';
import {getSiCard9Examples} from '../../../SiCard/types/siCard9Examples';

export class SiCard9Simulator extends ModernSiCardSimulator {
    static siCardClass = SiCard9;
    static getAllExamples = getSiCard9Examples;

    public storage: storage.ISiStorage<ISiCard9StorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = siCard9StorageDefinition(storageData);
    }
}
