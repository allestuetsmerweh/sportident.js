import * as storage from '../../../storage';
import {IModernSiCardStorageFields, modernSiCardStorageDefinition} from '../../../SiCard/types/ModernSiCard';
import {FakeModernSiCard} from './FakeModernSiCard';
import {SIAC} from '../../../SiCard/types/SIAC';
import {getModernSiCardExamples} from '../../../SiCard/types/modernSiCardExamples';

export class FakeSIAC extends FakeModernSiCard {
    static siCardClass = SIAC;
    static getAllExamples = getModernSiCardExamples;

    public storage: storage.ISiStorage<IModernSiCardStorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = modernSiCardStorageDefinition(storageData);
    }
}
