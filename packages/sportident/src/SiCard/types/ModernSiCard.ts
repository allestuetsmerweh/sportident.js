import _ from 'lodash';
import {proto} from '../../constants';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;

const MAX_NUM_PUNCHES = 128;

/* eslint-disable no-unused-vars */
export enum ModernSiCardSeries {
    SiCard8 = 0x02,
    SiCard9 = 0x01,
    SiCard10 = 0x0F,
    PCard = 0x04,
    TCard = 0x06,
}
/* eslint-enable no-unused-vars */

export interface PotentialModernSiCardPunch {
    code: number|undefined;
    time: number|undefined;
}


export const getPunchOffset = (i: number): number => (
    bytesPerPage * 4 + i * 4
);

export const cropPunches = (allPunches: PotentialModernSiCardPunch[]) => {
    const isPunchEntryInvalid = (punch: PotentialModernSiCardPunch) => punch.time === undefined || punch.time === 0xEEEE;
    const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
    return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
};

export const getCroppedString = (charCodes: (number|undefined)[]) => {
    const isCharacterInvalid = (charCode: number|undefined) => charCode === undefined || charCode === 0xEE;
    const firstInvalidIndex = charCodes.findIndex(isCharacterInvalid);
    const croppedCharCodes = (firstInvalidIndex === -1 ? charCodes : charCodes.slice(0, firstInvalidIndex)) as number[];
    return croppedCharCodes.map((charCode: number) => String.fromCharCode(charCode)).join('');
};

export const parseCardHolderString = (
    semicolonSeparatedString: string,
): {[property: string]: any} => {
    const informationComponents = semicolonSeparatedString.split(';');
    return {
        firstName: informationComponents.length > 1 ? informationComponents[0] : undefined,
        lastName: informationComponents.length > 2 ? informationComponents[1] : undefined,
        gender: informationComponents.length > 3 ? informationComponents[2] : undefined,
        birthday: informationComponents.length > 4 ? informationComponents[3] : undefined,
        club: informationComponents.length > 5 ? informationComponents[4] : undefined,
        email: informationComponents.length > 6 ? informationComponents[5] : undefined,
        phone: informationComponents.length > 7 ? informationComponents[6] : undefined,
        city: informationComponents.length > 8 ? informationComponents[7] : undefined,
        street: informationComponents.length > 9 ? informationComponents[8] : undefined,
        zip: informationComponents.length > 10 ? informationComponents[9] : undefined,
        country: informationComponents.length > 11 ? informationComponents[10] : undefined,
        isComplete: informationComponents.length > 11,
    };
};

export const parseCardHolder = (maybeCharCodes: (number|undefined)[]) => {
    const semicolonSeparatedString = getCroppedString(maybeCharCodes);
    return parseCardHolderString(semicolonSeparatedString || '');
};

export const ModernSiCardStorageDefinition = storage.defineStorage(0x400, {
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
    startTime: new storage.SiInt([[0x0F], [0x0E]]),
    finishTime: new storage.SiInt([[0x13], [0x12]]),
    checkTime: new storage.SiInt([[0x0B], [0x0A]]),
    punchCount: new storage.SiInt([[0x16]]),
    punches: new storage.SiModified(
        new storage.SiArray(
            MAX_NUM_PUNCHES,
            (i) => new storage.SiDict({
                code: new storage.SiInt([
                    [getPunchOffset(i) + 1],
                ]),
                time: new storage.SiInt([
                    [getPunchOffset(i) + 3],
                    [getPunchOffset(i) + 2],
                ]),
            }),
        ),
        (allPunches) => cropPunches(allPunches as unknown as PotentialModernSiCardPunch[]),
    ),
    cardHolder: new storage.SiModified(
        new storage.SiArray(
            0x80,
            (i) => new storage.SiInt([[0x20 + i]]),
        ),
        (charCodes) => parseCardHolder(charCodes),
    ),
});

export class ModernSiCard extends BaseSiCard {
    static maxNumPunches = MAX_NUM_PUNCHES;
    static StorageDefinition = ModernSiCardStorageDefinition;

    static typeSpecificShouldDetectFromMessage(message: siProtocol.SiMessage) {
        return message.mode === undefined && message.command === proto.cmd.SI8_DET;
    }

    public cardSeries?: ModernSiCardSeries;

    typeSpecificGetPage(pageNumber: number) {
        if (!this.mainStation) {
            throw new Error('No main station');
        }
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI8,
            parameters: [pageNumber],
        }, 1)
            .then((data: number[][]) => {
                console.assert(
                    data[0][2] === pageNumber,
                    `Page number ${data[0][2]} retrieved (expected ${pageNumber})`,
                );
                return data[0].slice(3);
            });
    }

    typeSpecificRead(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.typeSpecificReadBasic()
                .then(() => this.typeSpecificReadCardHolder())
                .then(() => this.typeSpecificReadPunches())
                .then(() => {
                    this.cardNumber = this.storage.get('cardNumber')!.value;
                    this.cardSeries = this.storage.get('cardSeries')!.value;
                    this.startTime = this.storage.get('startTime')!.value;
                    this.finishTime = this.storage.get('finishTime')!.value;
                    this.checkTime = this.storage.get('checkTime')!.value;
                    this.punchCount = this.storage.get('punchCount')!.value;
                    this.punches = this.storage.get('punches')!.value;
                    this.cardHolder = this.storage.get('cardHolder')!.value;
                    resolve();
                })
                .catch((exc: Error) => reject(exc));
        });
    }

    typeSpecificReadBasic() {
        return this.typeSpecificGetPage(0)
            .then((page0: number[]) => {
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                const readCardNumber = this.storage.get('cardNumber')!.value;
                if (this.cardNumber !== readCardNumber) {
                    console.warn(`ModernSiCard Number ${readCardNumber} (expected ${this.cardNumber})`);
                }
            });
    }

    typeSpecificReadCardHolder() {
        const cardHolderSoFar = this.storage.get('cardHolder')!.value;
        if (cardHolderSoFar && cardHolderSoFar.isComplete) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(1)
            .then((page1: number[]) => {
                this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
            });
    }

    typeSpecificReadPunches(): Promise<void> {
        if (this.storage.get('punchCount')!.value <= punchesPerPage * 0) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(4)
            .then((page4: number[]) => {
                this.storage.splice(bytesPerPage * 4, bytesPerPage, ...page4);
                if (this.storage.get('punchCount')!.value <= punchesPerPage * 1) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(5);
            })
            .then((page5: number[]) => {
                this.storage.splice(bytesPerPage * 5, bytesPerPage, ...page5);
                if (this.storage.get('punchCount')!.value <= punchesPerPage * 2) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(6);
            })
            .then((page6: number[]) => {
                this.storage.splice(bytesPerPage * 6, bytesPerPage, ...page6);
                if (this.storage.get('punchCount')!.value <= punchesPerPage * 3) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(7);
            })
            .then((page7: number[]) => {
                this.storage.splice(bytesPerPage * 7, bytesPerPage, ...page7);
                throw new ReadFinishedException();
            })
            .catch((exc: Error) => {
                if (exc instanceof ReadFinishedException) {
                    return;
                }
                throw exc;
            });
    }
}
