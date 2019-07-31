import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;

export class SiCard9 extends ModernSiCard {
    static getPunchOffset(i) {
        return 0x38 + i * 4;
    }

    static parseCardHolderString(semicolonSeparatedString) {
        const informationComponents = semicolonSeparatedString.split(';');
        return {
            firstName: informationComponents.length > 1 ? informationComponents[0] : undefined,
            lastName: informationComponents.length > 2 ? informationComponents[1] : undefined,
            isComplete: informationComponents.length > 2,
        };
    }

    typeSpecificRead() {
        return new Promise((resolve, reject) => {
            this.typeSpecificGetPage(0)
                .then((page0) => {
                    this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                    const readCardNumber = this.storage.get('cardNumber').value;
                    if (this.cardNumber !== readCardNumber) {
                        console.warn(`SICard9 Number ${readCardNumber} (expected ${this.cardNumber})`);
                    }

                    if (this.storage.get('punchCount').value <= punchesPerPage * 0) {
                        throw new ReadFinishedException();
                    }
                    return this.typeSpecificGetPage(1);
                })
                .then((page1) => {
                    this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
                    throw new ReadFinishedException();
                })
                .catch((exc) => {
                    if (exc instanceof ReadFinishedException) {
                        Object.keys(this.constructor.StorageDefinition.definitions).forEach((key) => {
                            this[key] = this.storage.get(key).value;
                        });
                        resolve(this);
                    } else {
                        reject(exc);
                    }
                });
        });
    }
}
BaseSiCard.registerNumberRange(1000000, 2000000, SiCard9);

SiCard9.maxNumPunches = 50;
SiCard9.StorageDefinition = storage.defineStorage(0x100, {
    uid: new storage.SiInt([[0x03], [0x02], [0x01], [0x00]]),
    cardSeries: new storage.SiEnum([[0x18]], ModernSiCard.Series, (value) => value.val),
    cardNumber: new storage.SiArray(
        3,
        (i) => new storage.SiInt([[0x19 + (2 - i)]]),
    ).modify(
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
    ),
    startTime: new storage.SiInt([[0x0E], [0x0F]]),
    finishTime: new storage.SiInt([[0x12], [0x13]]),
    checkTime: new storage.SiInt([[0x0A], [0x0B]]),
    punchCount: new storage.SiInt([[0x16]]),
    punches: new storage.SiArray(
        SiCard9.maxNumPunches,
        (i) => new storage.SiDict({
            code: new storage.SiInt([
                [SiCard9.getPunchOffset(i) + 1],
            ]),
            time: new storage.SiInt([
                [SiCard9.getPunchOffset(i) + 2],
                [SiCard9.getPunchOffset(i) + 3],
            ]),
        }),
    ).modify(
        (allPunches) => SiCard9.cropPunches(allPunches),
    ),
    cardHolder: new storage.SiArray(
        0x18,
        (i) => new storage.SiInt([[0x20 + i]]),
    ).modify(
        (charCodes) => SiCard9.parseCardHolder(charCodes),
    ),
});
