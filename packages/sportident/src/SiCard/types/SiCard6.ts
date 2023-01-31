import _ from 'lodash';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {IBaseSiCardStorageFields} from '../ISiCard';
import {BaseSiCard} from '../BaseSiCard';
import {IPunch} from '../IRaceResultData';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;
const MAX_NUM_PUNCHES = 64;

interface PotentialSiCard6Punch {
    code: number|undefined;
    time: siProtocol.SiTimestamp|undefined;
}

export const getPunchOffset = (i: number): number => (
    bytesPerPage * 6 + i * 4
);

export const cropPunches = (
    allPunches: (PotentialSiCard6Punch|undefined)[],
): IPunch[] => {
    const isPunchEntryValid = (
        punch: PotentialSiCard6Punch|undefined,
    ): punch is IPunch => (
        punch !== undefined
        && punch.code !== undefined
        && punch.time !== undefined
        && punch.time !== null
    );
    const firstInvalidIndex = allPunches.findIndex((punch) => !isPunchEntryValid(punch));
    const punchesUntilInvalid = (firstInvalidIndex === -1
        ? allPunches
        : allPunches.slice(0, firstInvalidIndex)
    );
    return punchesUntilInvalid.filter<IPunch>(isPunchEntryValid);
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

export interface ISiCard6StorageFields extends IBaseSiCardStorageFields {
    clearTime: siProtocol.SiTimestamp;
    lastPunchedCode: number;
    punchCountPlus1: number;
    cardHolder: {
        lastName: string|undefined,
        firstName: string|undefined,
        country: string|undefined,
        club: string|undefined,
        userId: string|undefined,
        phone: string|undefined,
        email: string|undefined,
        street: string|undefined,
        city: string|undefined,
        zip: string|undefined,
        gender: string|undefined,
        birthday: string|undefined,
        isComplete: boolean|undefined,
    };
}

export const siCard6StorageLocations: storage.ISiStorageLocations<ISiCard6StorageFields> = {
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
    startTime: new siProtocol.SiTime([[0x1B], [0x1A]]),
    finishTime: new siProtocol.SiTime([[0x17], [0x16]]),
    checkTime: new siProtocol.SiTime([[0x1F], [0x1E]]),
    clearTime: new siProtocol.SiTime([[0x23], [0x22]]),
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
                time: new siProtocol.SiTime([
                    [getPunchOffset(i) + 3],
                    [getPunchOffset(i) + 2],
                ]),
            }),
        ),
        (allPunches) => cropPunches(allPunches),
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
            (charCodes) => charCodes.every((charCode) => charCode !== undefined),
        ),
    }),
};
export const siCard6StorageDefinition = storage.defineStorage(
    0x400,
    siCard6StorageLocations,
);

export class SiCard6 extends BaseSiCard {
    static maxNumPunches = MAX_NUM_PUNCHES;

    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage): SiCard6|undefined {
        if (message.mode !== undefined) {
            return undefined;
        }
        if (message.command !== proto.cmd.SI6_DET) {
            return undefined;
        }
        if (message.parameters.length < 6) {
            return undefined;
        }
        const cardNumber = siProtocol.arr2cardNumber([
            message.parameters[5],
            message.parameters[4],
            message.parameters[3],
        ]);
        /* istanbul ignore next */
        if (cardNumber === undefined) {
            throw new Error('card number cannot be undefined');
        }
        return new this(cardNumber);
    }

    public storage: storage.ISiStorage<ISiCard6StorageFields>;

    public punchCount?: number;
    public punchCountPlus1?: number;
    public lastPunchedCode?: number;

    constructor(cardNumber: number) {
        super(cardNumber);
        this.storage = siCard6StorageDefinition();
    }

    typeSpecificGetPage(pageNumber: number): Promise<number[]> {
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
                    this.raceResult = {
                        cardNumber: this.storage.get('cardNumber')!.value,
                        startTime: this.storage.get('startTime')?.value,
                        finishTime: this.storage.get('finishTime')?.value,
                        clearTime: this.storage.get('clearTime')?.value,
                        checkTime: this.storage.get('checkTime')?.value,
                        punches: this.storage.get('punches')!.value,
                        cardHolder: this.storage.get('cardHolder')!.value,
                    };
                    this.punchCount = this.storage.get('punchCount')!.value;
                    this.punchCountPlus1 = this.storage.get('punchCountPlus1')!.value;
                    this.lastPunchedCode = this.storage.get('lastPunchedCode')!.value;
                    resolve();
                })
                .catch((exc: Error) => reject(exc));
        });
    }

    typeSpecificReadBasic(): Promise<void> {
        return this.typeSpecificGetPage(0)
            .then((page0: number[]) => {
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                const readCardNumber = this.storage.get('cardNumber')!.value;
                if (this.cardNumber !== readCardNumber) {
                    console.warn(`SICard6 Number ${readCardNumber} (expected ${this.cardNumber})`);
                }
            });
    }

    typeSpecificReadCardHolder(): Promise<void> {
        // TODO: test this with real device
        return this.typeSpecificGetPage(1)
            .then((page1: number[]) => {
                this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
            });
    }

    typeSpecificReadPunches(): Promise<void> {
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
