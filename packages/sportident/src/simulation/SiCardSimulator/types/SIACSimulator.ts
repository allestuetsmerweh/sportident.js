// eslint-disable-next-line no-unused-vars
import * as storage from '../../../storage';
// eslint-disable-next-line no-unused-vars
import {IModernSiCardStorageFields, modernSiCardStorageDefinition} from '../../../SiCard/types/ModernSiCard';
import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {SIAC} from '../../../SiCard/types/SIAC';
import {getModernSiCardExamples} from '../../../SiCard/types/modernSiCardExamples';

export class SIACSimulator extends ModernSiCardSimulator {
    static siCardClass = SIAC;
    static getAllExamples = getModernSiCardExamples;

    public storage: storage.ISiStorage<IModernSiCardStorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = modernSiCardStorageDefinition(storageData);
    }
}
