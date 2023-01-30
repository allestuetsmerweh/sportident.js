import * as storage from '../../../storage';
import {IModernSiCardStorageFields, modernSiCardStorageDefinition} from '../../../SiCard/types/ModernSiCard';
import {FakeModernSiCard} from './FakeModernSiCard';
import {SiCard10} from '../../../SiCard/types/SiCard10';
import {getModernSiCardExamples} from '../../../SiCard/types/modernSiCardExamples';

export class FakeSiCard10 extends FakeModernSiCard {
    static siCardClass = SiCard10;
    static getAllExamples = getModernSiCardExamples;

    public storage: storage.ISiStorage<IModernSiCardStorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = modernSiCardStorageDefinition(storageData);
    }
}
