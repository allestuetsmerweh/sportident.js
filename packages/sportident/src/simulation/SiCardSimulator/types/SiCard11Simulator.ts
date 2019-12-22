// eslint-disable-next-line no-unused-vars
import * as storage from '../../../storage';
// eslint-disable-next-line no-unused-vars
import {IModernSiCardStorageFields, modernSiCardStorageDefinition} from '../../../SiCard/types/ModernSiCard';
import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SiCard11} from '../../../SiCard/types/SiCard11';
import {getModernSiCardExamples} from '../../../SiCard/types/modernSiCardExamples';

export class SiCard11Simulator extends ModernSiCardSimulator {
    static siCardClass = SiCard11;
    static getAllExamples = getModernSiCardExamples;

    public storage: storage.ISiStorage<IModernSiCardStorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = modernSiCardStorageDefinition(storageData);
    }
}
