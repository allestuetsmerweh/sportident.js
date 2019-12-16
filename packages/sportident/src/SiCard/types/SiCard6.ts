import _ from 'lodash';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;
const MAX_NUM_PUNCHES = 64;

interface PotentialSiCard6Punch {
    code: number|undefined;
    time: number|undefined;
}

export const getPunchOffset = (i: number): number => (
    bytesPerPage * 6 + i * 4
);

export const cropPunches = (allPunches: PotentialSiCard6Punch[]) => {
    const isPunchEntryInvalid = (punch: PotentialSiCard6Punch) => punch.time === undefined || punch.time === 0xEEEE;
    const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
    return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
};

const getCroppedString = (maybeCharCodes: (number|undefined)[]) => {
    if (maybeCharCodes.some((maybeCharCode: number|undefined) => maybeCharCode === undefined)) {
        return undefined;
    }
    const charCodes = maybeCharCodes as number[];
    const isCharacterInvalid = (charCode: number) => charCode === 0x20;
    const firstInvalidIndex = charCodes.findIndex(isCharacterInvalid);
    const croppedCharCodes = firstInvalidIndex === -1 ? charCodes : charCodes.slice(0, firstInvalidIndex);
    return croppedCharCodes.map((charCode: number) => String.fromCharCode(charCode)).join('');
};

export const SiCard6StorageDefinition = storage.defineStorage(0x400, {
    cardNumber: new storage.SiModified(
        new storage.SiArray(
            3,
            (i) => new storage.SiInt([[0x0B + (2 - i)]]),
        ),
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        // (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
        // (cardNumber) => `${cardNumber}`,
        // (cardNumberString) => parseInt(cardNumberString, 10),
        // (cardNumber) => cardNumber !== undefined && _.isInteger(cardNumber) && cardNumber >= 0,
    ),
    startTime: new storage.SiInt([[0x1B], [0x1A]]),
    finishTime: new storage.SiInt([[0x17], [0x16]]),
    checkTime: new storage.SiInt([[0x1F], [0x1E]]),
    clearTime: new storage.SiInt([[0x23], [0x22]]),
    lastPunchedCode: new storage.SiInt([[0x11], [0x10]]),
    punchCount: new storage.SiInt([[0x12]]),
    punchCountPlus1: new storage.SiInt([[0x13]]),
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
        // TODO: a punch in allPunches can't actually be undefined
        (allPunches) => cropPunches(allPunches as unknown as PotentialSiCard6Punch[]),
    ),
    cardHolder: new storage.SiDict({
        lastName: new storage.SiModified(
            new storage.SiArray(20, (i) => new storage.SiInt([[0x30 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        firstName: new storage.SiModified(
            new storage.SiArray(20, (i) => new storage.SiInt([[0x44 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        country: new storage.SiModified(
            new storage.SiArray(4, (i) => new storage.SiInt([[0x58 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        club: new storage.SiModified(
            new storage.SiArray(36, (i) => new storage.SiInt([[0x5C + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        userId: new storage.SiModified(
            new storage.SiArray(16, (i) => new storage.SiInt([[0x80 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        phone: new storage.SiModified(
            new storage.SiArray(16, (i) => new storage.SiInt([[0x90 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        email: new storage.SiModified(
            new storage.SiArray(36, (i) => new storage.SiInt([[0xA0 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        street: new storage.SiModified(
            new storage.SiArray(20, (i) => new storage.SiInt([[0xC4 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        city: new storage.SiModified(
            new storage.SiArray(16, (i) => new storage.SiInt([[0xD8 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        zip: new storage.SiModified(
            new storage.SiArray(8, (i) => new storage.SiInt([[0xE8 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        gender: new storage.SiModified(
            new storage.SiArray(4, (i) => new storage.SiInt([[0xF0 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        birthday: new storage.SiModified(
            new storage.SiArray(8, (i) => new storage.SiInt([[0xF4 + i]])),
            (charCodes) => getCroppedString(charCodes),
        ),
        isComplete: new storage.SiModified(
            new storage.SiArray(0xD0, (i) => new storage.SiInt([[0x30 + i]])),
            // TODO: 'non-falsy' => relieve type constraints on SiDict
            (charCodes) => (charCodes.every((charCode) => charCode !== undefined) ? 'non-falsy' : '') as (string|undefined),
        ),
    }),
});

export class SiCard6 extends BaseSiCard {
    static maxNumPunches = MAX_NUM_PUNCHES;
    static StorageDefinition = SiCard6StorageDefinition;

    static typeSpecificShouldDetectFromMessage(message: siProtocol.SiMessage) {
        return message.mode === undefined && message.command === proto.cmd.SI6_DET;
    }

    public punchCountPlus1?: number;
    public lastPunchedCode?: number;

    typeSpecificGetPage(pageNumber: number) {
        if (!this.mainStation) {
            return Promise.reject(new Error('No main station'));
        }
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI6,
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
                    this.startTime = this.storage.get('startTime')!.value;
                    this.finishTime = this.storage.get('finishTime')!.value;
                    this.clearTime = this.storage.get('clearTime')!.value;
                    this.checkTime = this.storage.get('checkTime')!.value;
                    this.punchCount = this.storage.get('punchCount')!.value;
                    this.punchCountPlus1 = this.storage.get('punchCountPlus1')!.value;
                    this.punches = this.storage.get('punches')!.value;
                    this.cardHolder = this.storage.get('cardHolder')!.value;
                    this.lastPunchedCode = this.storage.get('lastPunchedCode')!.value;
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
                    console.warn(`SICard6 Number ${readCardNumber} (expected ${this.cardNumber})`);
                }
            });
    }

    typeSpecificReadCardHolder() { // TODO: test this with real device
        return this.typeSpecificGetPage(1)
            .then((page1: number[]) => {
                this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
            });
    }

    typeSpecificReadPunches() {
        if (this.storage.get('punchCount')!.value <= punchesPerPage * 0) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(6)
            .then((page6: number[]) => {
                this.storage.splice(bytesPerPage * 6, bytesPerPage, ...page6);
                if (this.storage.get('punchCount')!.value <= punchesPerPage * 1) {
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
BaseSiCard.registerNumberRange(500000, 1000000, SiCard6);
BaseSiCard.registerNumberRange(2003000, 2004000, SiCard6);
