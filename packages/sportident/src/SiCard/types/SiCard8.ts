import _ from 'lodash';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
// eslint-disable-next-line no-unused-vars
import {cropPunches, getCroppedString, ModernSiCard, ModernSiCardSeries, PotentialModernSiCardPunch} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;
const MAX_NUM_PUNCHES = 30;

export const getPunchOffset = (i: number): number => (
    0x88 + i * 4
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

export const SiCard8StorageDefinition = storage.defineStorage(0x100, {
    uid: new storage.SiInt([[0x03], [0x02], [0x01], [0x00]]),
    cardSeries: new storage.SiEnum([[0x18]], ModernSiCardSeries),
    cardNumber: new storage.SiModified(
        new storage.SiArray(
            3,
            (i) => new storage.SiInt([[0x19 + (2 - i)]]),
        ),
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
        (cardNumber) => `${cardNumber}`,
        (cardNumberString) => parseInt(cardNumberString, 10),
        (cardNumber) => cardNumber !== undefined && _.isInteger(cardNumber) && cardNumber >= 0,
    ),
    startTime: new storage.SiInt([[0x0E], [0x0F]]),
    finishTime: new storage.SiInt([[0x12], [0x13]]),
    checkTime: new storage.SiInt([[0x0A], [0x0B]]),
    punchCount: new storage.SiInt([[0x16]]),
    punches: new storage.SiModified(
        new storage.SiArray(
            MAX_NUM_PUNCHES,
            (i) => new storage.SiDict({
                code: new storage.SiInt([
                    [getPunchOffset(i) + 1],
                ]),
                time: new storage.SiInt([
                    [getPunchOffset(i) + 2],
                    [getPunchOffset(i) + 3],
                ]),
            }),
        ),
        (allPunches) => cropPunches(allPunches as unknown as PotentialModernSiCardPunch[]),
    ),
    cardHolder: new storage.SiModified(
        new storage.SiArray(
            0x60,
            (i) => new storage.SiInt([[0x20 + i]]),
        ),
        (charCodes) => parseCardHolder(charCodes),
    ),
});

export class SiCard8 extends ModernSiCard {
    static maxNumPunches = MAX_NUM_PUNCHES;
    static StorageDefinition = SiCard8StorageDefinition;

    typeSpecificRead(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.typeSpecificGetPage(0)
                .then((page0: number[]) => {
                    this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                    const readCardNumber = this.storage.get('cardNumber')!.value;
                    if (this.cardNumber !== readCardNumber) {
                        console.warn(`SICard8 Number ${readCardNumber} (expected ${this.cardNumber})`);
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
                        Object.keys(this.StorageDefinition.definitions).forEach((key) => {
                            // @ts-ignore
                            this[key] = this.storage.get(key).value;
                        });
                        resolve();
                    } else {
                        reject(exc);
                    }
                });
        });
    }
}
BaseSiCard.registerNumberRange(2000000, 2003000, SiCard8);
BaseSiCard.registerNumberRange(2004000, 3000000, SiCard8);
