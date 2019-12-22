// eslint-disable-next-line no-unused-vars
import * as storage from '../../../storage';
import {ModernSiCardSimulator} from './ModernSiCardSimulator';
// eslint-disable-next-line no-unused-vars
import {ISiCard8StorageFields, SiCard8, siCard8StorageDefinition} from '../../../SiCard/types/SiCard8';
import {getSiCard8Examples} from '../../../SiCard/types/siCard8Examples';

export class SiCard8Simulator extends ModernSiCardSimulator {
    static siCardClass = SiCard8;
    static getAllExamples = getSiCard8Examples;

    public storage: storage.ISiStorage<ISiCard8StorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = siCard8StorageDefinition(storageData);
    }
}
