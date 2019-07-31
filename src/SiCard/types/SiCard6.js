import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;

export class SiCard6 extends BaseSiCard {
    static typeSpecificShouldDetectFromMessage(message) {
        return message.command === proto.cmd.SI6_DET;
    }

    static getPunchOffset(i) {
        return bytesPerPage * 6 + i * 4;
    }

    static cropPunches(allPunches) {
        const isPunchEntryInvalid = (punch) => punch.time === undefined || punch.time === 0xEEEE;
        const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
        return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
    }

    static getCroppedString(charCodes) {
        if (charCodes.some((charCode) => charCode === undefined)) {
            return undefined;
        }
        const isCharacterInvalid = (charCode) => charCode === 0x20;
        const firstInvalidIndex = charCodes.findIndex(isCharacterInvalid);
        const croppedCharCodes = firstInvalidIndex === -1 ? charCodes : charCodes.slice(0, firstInvalidIndex);
        return croppedCharCodes.map((charCode) => String.fromCharCode(charCode)).join('');
    }

    typeSpecificGetPage(pageNumber) {
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI6,
            parameters: [pageNumber],
        }, 1)
            .then((data) => {
                console.assert(
                    data[0][2] === pageNumber,
                    `Page number ${data[0][2]} retrieved (expected ${pageNumber})`,
                );
                return data[0].slice(3);
            });
    }

    typeSpecificRead() {
        return new Promise((resolve, reject) => {
            this.typeSpecificReadBasic()
                .then(() => this.typeSpecificReadCardHolder())
                .then(() => this.typeSpecificReadPunches())
                .then(() => {
                    Object.keys(this.constructor.StorageDefinition.definitions).forEach((key) => {
                        this[key] = this.storage.get(key).value;
                    });
                    resolve(this);
                })
                .catch((exc) => reject(exc));
        });
    }

    typeSpecificReadBasic() {
        return this.typeSpecificGetPage(0)
            .then((page0) => {
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                const readCardNumber = this.storage.get('cardNumber').value;
                if (this.cardNumber !== readCardNumber) {
                    console.warn(`SICard6 Number ${readCardNumber} (expected ${this.cardNumber})`);
                }
            });
    }

    typeSpecificReadCardHolder() { // TODO: test this with real device
        return this.typeSpecificGetPage(1)
            .then((page1) => {
                this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
            });
    }

    typeSpecificReadPunches() {
        if (this.storage.get('punchCount').value <= punchesPerPage * 0) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(6)
            .then((page6) => {
                this.storage.splice(bytesPerPage * 6, bytesPerPage, ...page6);
                if (this.storage.get('punchCount').value <= punchesPerPage * 1) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(7);
            })
            .then((page7) => {
                this.storage.splice(bytesPerPage * 7, bytesPerPage, ...page7);
                throw new ReadFinishedException();
            })
            .catch((exc) => {
                if (exc instanceof ReadFinishedException) {
                    return this;
                }
                throw exc;
            });
    }
}
BaseSiCard.registerNumberRange(500000, 1000000, SiCard6);
BaseSiCard.registerNumberRange(2003000, 2004000, SiCard6);

SiCard6.maxNumPunches = 64;
SiCard6.StorageDefinition = storage.defineStorage(0x400, {
    cardNumber: new storage.SiArray(
        3,
        (i) => new storage.SiInt([[0x0B + (2 - i)]]),
    ).modify(
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
    ),
    startTime: new storage.SiInt([[0x1A], [0x1B]]),
    finishTime: new storage.SiInt([[0x16], [0x17]]),
    checkTime: new storage.SiInt([[0x1E], [0x1F]]),
    clearTime: new storage.SiInt([[0x22], [0x23]]),
    lastPunchedCode: new storage.SiInt([[0x11], [0x10]]),
    punchCount: new storage.SiInt([[0x12]]),
    punchCountPlus1: new storage.SiInt([[0x13]]),
    punches: new storage.SiArray(
        SiCard6.maxNumPunches,
        (i) => new storage.SiDict({
            code: new storage.SiInt([
                [SiCard6.getPunchOffset(i) + 1],
            ]),
            time: new storage.SiInt([
                [SiCard6.getPunchOffset(i) + 2],
                [SiCard6.getPunchOffset(i) + 3],
            ]),
        }),
    ).modify(
        (allPunches) => SiCard6.cropPunches(allPunches),
    ),
    cardHolder: new storage.SiDict({
        lastName: new storage.SiArray(20, (i) => new storage.SiInt([[0x30 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        firstName: new storage.SiArray(20, (i) => new storage.SiInt([[0x44 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        country: new storage.SiArray(4, (i) => new storage.SiInt([[0x58 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        club: new storage.SiArray(36, (i) => new storage.SiInt([[0x5C + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        userId: new storage.SiArray(16, (i) => new storage.SiInt([[0x80 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        phone: new storage.SiArray(16, (i) => new storage.SiInt([[0x90 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        email: new storage.SiArray(36, (i) => new storage.SiInt([[0xA0 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        street: new storage.SiArray(20, (i) => new storage.SiInt([[0xC4 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        city: new storage.SiArray(16, (i) => new storage.SiInt([[0xD8 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        zip: new storage.SiArray(8, (i) => new storage.SiInt([[0xE8 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        gender: new storage.SiArray(4, (i) => new storage.SiInt([[0xF0 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        birthday: new storage.SiArray(8, (i) => new storage.SiInt([[0xF4 + i]])).modify(
            (charCodes) => SiCard6.getCroppedString(charCodes),
        ),
        isComplete: new storage.SiArray(0xD0, (i) => new storage.SiInt([[0x30 + i]])).modify(
            (charCodes) => charCodes.every((charCode) => charCode !== undefined),
        ),
    }),
});
