import _ from 'lodash';
import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';

const bytesPerPage = 128;

interface PotentialSiCard5Punch {
    code: number|undefined;
    time: number|undefined;
}

export class SiCard5 extends BaseSiCard {
    static maxNumPunches = 36;
    static get StorageDefinition() {
        return SiCard5StorageDefinition;
    }

    static typeSpecificShouldDetectFromMessage(message: siProtocol.SiMessage) {
        return message.mode === undefined && message.command === proto.cmd.SI5_DET;
    }

    static getPunchOffset(i: number): number {
        return (i >= 30
            ? 0x20 + (i - 30) * 16
            : 0x20 + Math.floor(i / 5) + 1 + i * 3
        );
    }

    static cropPunches(allPunches: PotentialSiCard5Punch[]) {
        const isPunchEntryInvalid = (punch: PotentialSiCard5Punch) => punch.code === undefined || punch.code === 0x00;
        const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
        return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
    }

    typeSpecificRead() {
        if (!this.mainStation) {
            throw new Error('No main station');
        }
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI5,
            parameters: [],
        }, 1)
            .then((data: number[][]) => {
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...data[0].slice(2));

                const readCardNumber = this.storage.get('cardNumber')!.value;
                if (this.cardNumber !== readCardNumber) {
                    console.warn(`SICard5 Number ${readCardNumber} (expected ${this.cardNumber})`);
                }

                Object.keys(this.StorageDefinition.definitions).forEach((key) => {
                    // @ts-ignore
                    this[key] = this.storage.get(key).value;
                });
            });
    }
}
BaseSiCard.registerNumberRange(1000, 500000, SiCard5);

export const SiCard5StorageDefinition = storage.defineStorage(0x80, {
    cardNumber: new storage.SiModified(
        new storage.SiArray(
            3,
            (i) => new storage.SiInt([[([0x05, 0x04, 0x06][i])]]),
        ),
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
        (cardNumber) => `${cardNumber}`,
        (cardNumberString) => parseInt(cardNumberString, 10),
        (cardNumber) => cardNumber !== undefined && _.isInteger(cardNumber) && cardNumber >= 0,
    ),
    startTime: new storage.SiInt([[0x13], [0x14]]),
    finishTime: new storage.SiInt([[0x15], [0x16]]),
    checkTime: new storage.SiInt([[0x19], [0x1A]]),
    punchCount: new storage.SiModified(
        new storage.SiInt([[0x17]]),
        (extractedValue) => extractedValue - 1,
    ),
    punches: new storage.SiModified(
        new storage.SiArray(
            SiCard5.maxNumPunches,
            (i) => new storage.SiDict({
                code: new storage.SiInt([
                    [SiCard5.getPunchOffset(i) + 0],
                ]),
                time: new storage.SiInt((i >= 30
                    ? []
                    : [
                        [SiCard5.getPunchOffset(i) + 1],
                        [SiCard5.getPunchOffset(i) + 2],
                    ]
                )),
            }),
        ),
        // TODO: a punch in allPunches can't actually be undefined
        (allPunches) => SiCard5.cropPunches(allPunches as unknown as PotentialSiCard5Punch[]),
    ),
    cardHolder: new storage.SiDict({
        countryCode: new storage.SiInt([[0x01]]),
        clubCode: new storage.SiInt([[0x03], [0x02]]),
    }),
    softwareVersion: new storage.SiInt([[0x1B]]),
});
