import _ from 'lodash';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
// eslint-disable-next-line no-unused-vars
import {cropPunches, getCroppedString, ModernSiCard, ModernSiCardSeries} from './ModernSiCard';
// eslint-disable-next-line no-unused-vars
import {BaseSiCard, IBaseSiCardStorageFields} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;
const MAX_NUM_PUNCHES = 50;

export const getPunchOffset = (i: number): number => (
    0x38 + i * 4
);

const parseCardHolderString = (
    semicolonSeparatedString: string,
): {[property: string]: any} => {
    const informationComponents = semicolonSeparatedString.split(';');
    return {
        firstName: informationComponents.length > 1 ? informationComponents[0] : undefined,
        lastName: informationComponents.length > 2 ? informationComponents[1] : undefined,
        isComplete: informationComponents.length > 2,
    };
};

const parseCardHolder = (maybeCharCodes: (number|undefined)[]) => {
    const semicolonSeparatedString = getCroppedString(maybeCharCodes);
    return parseCardHolderString(semicolonSeparatedString || '');
};

export interface ISiCard9StorageFields extends IBaseSiCardStorageFields {
    uid: number;
    cardSeries: ModernSiCardSeries;
}

export const siCard9StorageLocations: storage.ISiStorageLocations<ISiCard9StorageFields> = {
    uid: new storage.SiInt([[0x03], [0x02], [0x01], [0x00]]),
    cardSeries: new storage.SiEnum([[0x18]], ModernSiCardSeries),
    cardNumber: new storage.SiModified(
        new storage.SiArray(
            3,
            (i) => new storage.SiInt([[0x19 + (2 - i)]]),
        ),
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        // (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
        // (cardNumber) => `${cardNumber}`,
        // (cardNumberString) => parseInt(cardNumberString, 10),
        // (cardNumber) => cardNumber !== undefined && _.isInteger(cardNumber) && cardNumber >= 0,
    ),
    startTime: new siProtocol.SiTime([[0x0F], [0x0E]]),
    finishTime: new siProtocol.SiTime([[0x13], [0x12]]),
    checkTime: new siProtocol.SiTime([[0x0B], [0x0A]]),
    punchCount: new storage.SiInt([[0x16]]),
    punches: new storage.SiModified(
        new storage.SiArray(
            MAX_NUM_PUNCHES,
            (i) => new storage.SiDict({
                code: new storage.SiInt([
                    [getPunchOffset(i) + 1],
                ]),
                time: new siProtocol.SiTime([
                    [getPunchOffset(i) + 3],
                    [getPunchOffset(i) + 2],
                ]),
            }),
        ),
        (allPunches) => cropPunches(allPunches),
    ),
    cardHolder: new storage.SiModified(
        new storage.SiArray(
            0x18,
            (i) => new storage.SiInt([[0x20 + i]]),
        ),
        (charCodes) => parseCardHolder(charCodes),
    ),
};
export const siCard9StorageDefinition = storage.defineStorage(
    0x100,
    siCard9StorageLocations,
);

export class SiCard9 extends ModernSiCard {
    static maxNumPunches = MAX_NUM_PUNCHES;

    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage) {
        const info = this.parseModernSiCardDetectionMessage(message);
        if (info === undefined) {
            return undefined;
        }
        if (info.cardSeries !== ModernSiCardSeries.SiCard9) {
            return undefined;
        }
        return new this(info.cardNumber);
    }

    public storage: storage.ISiStorage<ISiCard9StorageFields>;

    public uid?: number;

    constructor(cardNumber: number) {
        super(cardNumber);
        this.storage = siCard9StorageDefinition();
    }

    typeSpecificRead(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.typeSpecificGetPage(0)
                .then((page0: number[]) => {
                    this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                    const readCardNumber = this.storage.get('cardNumber')!.value;
                    if (this.cardNumber !== readCardNumber) {
                        console.warn(`SICard9 Number ${readCardNumber} (expected ${this.cardNumber})`);
                    }

                    if (this.storage.get('punchCount')!.value <= punchesPerPage * 0) {
                        throw new ReadFinishedException();
                    }
                    return this.typeSpecificGetPage(1);
                })
                .then((page1: number[]) => {
                    this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
                    throw new ReadFinishedException();
                })
                .catch((exc: Error) => {
                    if (exc instanceof ReadFinishedException) {
                        this.raceResult = {
                            cardNumber: this.storage.get('cardNumber')!.value,
                            startTime: this.storage.get('startTime')!.value,
                            finishTime: this.storage.get('finishTime')!.value,
                            checkTime: this.storage.get('checkTime')!.value,
                            punches: this.storage.get('punches')!.value,
                            cardHolder: this.storage.get('cardHolder')!.value,
                        };
                        this.punchCount = this.storage.get('punchCount')!.value;
                        this.cardSeries = this.storage.get('cardSeries')!.value;
                        this.uid = this.storage.get('uid')!.value;
                        resolve();
                    } else {
                        reject(exc);
                    }
                });
        });
    }
}
BaseSiCard.registerNumberRange(1000000, 2000000, SiCard9);
