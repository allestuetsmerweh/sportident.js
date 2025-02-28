import * as storage from '../../../storage';
import {FakeModernSiCard} from './FakeModernSiCard';
import {IPCardStorageFields, PCard, pCardStorageDefinition} from '../../../SiCard/types/PCard';
import {getPCardExamples} from '../../../SiCard/types/pCardExamples';

export class FakePCard extends FakeModernSiCard {
    static siCardClass = PCard;
    static getAllExamples = getPCardExamples;

    public storage: storage.ISiStorage<IPCardStorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = pCardStorageDefinition(storageData);
    }
}
