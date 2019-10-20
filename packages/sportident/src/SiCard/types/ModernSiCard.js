import _ from 'lodash';
import {proto} from '../../constants';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}
const punchesPerPage = 32;
const bytesPerPage = 128;

export class ModernSiCard extends BaseSiCard {
    static typeSpecificShouldDetectFromMessage(message) {
        return message.command === proto.cmd.SI8_DET;
    }

    static getPunchOffset(i) {
        return bytesPerPage * 4 + i * 4;
    }

    static cropPunches(allPunches) {
        const isPunchEntryInvalid = (punch) => punch.time === undefined || punch.time === 0xEEEE;
        const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
        return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
    }

    static parseCardHolder(charCodes) {
        const semicolonSeparatedString = this.getCroppedString(charCodes);
        return this.parseCardHolderString(semicolonSeparatedString);
    }

    static getCroppedString(charCodes) {
        const isCharacterInvalid = (charCode) => charCode === 0xEE;
        const firstInvalidIndex = charCodes.findIndex(isCharacterInvalid);
        const croppedCharCodes = firstInvalidIndex === -1 ? charCodes : charCodes.slice(0, firstInvalidIndex);
        return croppedCharCodes.map((charCode) => String.fromCharCode(charCode)).join('');
    }

    static parseCardHolderString(semicolonSeparatedString) {
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
    }

    typeSpecificGetPage(pageNumber) {
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI8,
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
                    console.warn(`ModernSiCard Number ${readCardNumber} (expected ${this.cardNumber})`);
                }
            });
    }

    typeSpecificReadCardHolder() {
        const cardHolderSoFar = this.storage.get('cardHolder').value;
        if (cardHolderSoFar && cardHolderSoFar.isComplete) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(1)
            .then((page1) => {
                this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
            });
    }

    typeSpecificReadPunches() {
        if (this.storage.get('punchCount').value <= punchesPerPage * 0) {
            return Promise.resolve();
        }
        return this.typeSpecificGetPage(4)
            .then((page4) => {
                this.storage.splice(bytesPerPage * 4, bytesPerPage, ...page4);
                if (this.storage.get('punchCount').value <= punchesPerPage * 1) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(5);
            })
            .then((page5) => {
                this.storage.splice(bytesPerPage * 5, bytesPerPage, ...page5);
                if (this.storage.get('punchCount').value <= punchesPerPage * 2) {
                    throw new ReadFinishedException();
                }
                return this.typeSpecificGetPage(6);
            })
            .then((page6) => {
                this.storage.splice(bytesPerPage * 6, bytesPerPage, ...page6);
                if (this.storage.get('punchCount').value <= punchesPerPage * 3) {
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
ModernSiCard.Series = {
    SiCard8: {val: 0x02},
    SiCard9: {val: 0x01},
    SiCard10: {val: 0x0F},
    PCard: {val: 0x04},
    TCard: {val: 0x06},
};

ModernSiCard.maxNumPunches = 128;
ModernSiCard.StorageDefinition = storage.defineStorage(0x400, {
    uid: new storage.SiInt([[0x03], [0x02], [0x01], [0x00]]),
    cardSeries: new storage.SiEnum([[0x18]], ModernSiCard.Series, (value) => value.val),
    cardNumber: new storage.SiModified(
        new storage.SiArray(
            3,
            (i) => new storage.SiInt([[0x19 + (2 - i)]]),
        ),
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
        (cardNumber) => `${cardNumber}`,
        (cardNumberString) => parseInt(cardNumberString, 10),
        (cardNumber) => _.isInteger(cardNumber) && cardNumber >= 0,
    ),
    startTime: new storage.SiInt([[0x0E], [0x0F]]),
    finishTime: new storage.SiInt([[0x12], [0x13]]),
    checkTime: new storage.SiInt([[0x0A], [0x0B]]),
    punchCount: new storage.SiInt([[0x16]]),
    punches: new storage.SiModified(
        new storage.SiArray(
            ModernSiCard.maxNumPunches,
            (i) => new storage.SiDict({
                code: new storage.SiInt([
                    [ModernSiCard.getPunchOffset(i) + 1],
                ]),
                time: new storage.SiInt([
                    [ModernSiCard.getPunchOffset(i) + 2],
                    [ModernSiCard.getPunchOffset(i) + 3],
                ]),
            }),
        ),
        (allPunches) => ModernSiCard.cropPunches(allPunches),
    ),
    cardHolder: new storage.SiModified(
        new storage.SiArray(
            0x80,
            (i) => new storage.SiInt([[0x20 + i]]),
        ),
        (charCodes) => ModernSiCard.parseCardHolder(charCodes),
    ),
});
