import _ from 'lodash';
import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard5 extends BaseSiCard {
    static typeSpecificShouldDetectFromMessage(message) {
        return message.command === proto.cmd.SI5_DET;
    }

    typeSpecificRead() {
        const bytesPerPage = 128;
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI5,
            parameters: [],
        }, 1)
            .then((data) => {
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...data[0].slice(2));

                if (this.cardNumber !== this.storage.get('cardNumber')) {
                    console.warn(`SICard5 Number ${this.storage.get('cardNumber')} (expected ${this.cardNumber})`);
                }

                Object.keys(this.constructor.StorageDefinition.definitions).forEach((key) => {
                    this[key] = this.storage.get(key);
                });
            });
    }
}
BaseSiCard.registerNumberRange(1000, 500000, SiCard5);

const getPunchOffset = (i) => (i >= 30
    ? 32 + (i - 30) * 16
    : 32 + Math.floor(i / 5) + 1 + i * 3
);
SiCard5.StorageDefinition = utils.defineStorage(0x80, {
    cardNumber: new utils.SiArray(
        3,
        (i) => new utils.SiInt([[([5, 4, 6][i])]]),
    ).modify(
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
    ),
    startTime: new utils.SiInt([[19], [20]]),
    finishTime: new utils.SiInt([[21], [22]]),
    checkTime: new utils.SiInt([[25], [26]]),
    punchCount: new utils.SiInt([[23]]).modify(
        (extractedValue) => extractedValue - 1,
        (punchCount) => punchCount + 1,
    ),
    punches: new utils.SiArray(36, (i) => new utils.SiDict({
        code: new utils.SiInt([
            [getPunchOffset(i) + 0],
        ]),
        time: new utils.SiInt([...(i >= 30
            ? []
            : [
                [32 + Math.floor(i / 5) + 1 + i * 3 + 1],
                [32 + Math.floor(i / 5) + 1 + i * 3 + 2],
            ]
        )]),
    })).modify(
        (allPunches) => {
            const isPunchEntryInvalid = (punch) => punch.code === 0x00;
            const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
            return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
        },
    ),
});

SiCard5.getTestData = () => {
    const cardWith16Punches = {
        cardData: {
            cardNumber: 406402,
            startTime: 56093,
            finishTime: 12062,
            checkTime: 61166,
            punchCount: 16,
            punches: [
                {code: 31, time: 7967},
                {code: 32, time: 8224},
                {code: 33, time: 8481},
                {code: 34, time: 8738},
                {code: 35, time: 8995},
                {code: 36, time: 9252},
                {code: 37, time: 9509},
                {code: 38, time: 9766},
                {code: 39, time: 10023},
                {code: 40, time: 10280},
                {code: 41, time: 10537},
                {code: 42, time: 10794},
                {code: 43, time: 11051},
                {code: 44, time: 11308},
                {code: 45, time: 11565},
                {code: 46, time: 11822},
            ],
        },
        storageData: [
            ...utils.unPrettyHex(
                'AA 29 00 01 19 02 04 00 00 00 00 00 00 00 00 00' +
                '65 19 02 1D DB 1E 2F 11 56 EE EE 28 04 1F 00 07' +
                '00 1F 1F 1F 20 20 20 21 21 21 22 22 22 23 23 23' +
                '00 24 24 24 25 25 25 26 26 26 27 27 27 28 28 28' +
                '00 29 29 29 2A 2A 2A 2B 2B 2B 2C 2C 2C 2D 2D 2D' +
                '00 2E 2E 2E 00 EE EE 00 EE EE 00 EE EE 00 EE EE' +
                '00 00 EE EE 00 EE EE 00 EE EE 00 EE EE 00 EE EE' +
                '00 00 EE EE 00 EE EE 00 EE EE 00 EE EE 00 EE EE',
            ),
        ],
    };

    const fullCard = {
        cardData: {
            cardNumber: 406402,
            startTime: 56093,
            finishTime: 12062,
            checkTime: 61166,
            punchCount: 36,
            punches: [
                ..._.range(30).map(() => ({code: 32, time: 8224})),
                ..._.range(6).map(() => ({code: 32, time: 0})),
            ],
        },
        storageData: [
            ...utils.unPrettyHex(
                'AA 29 00 01 19 02 04 00 00 00 00 00 00 00 00 00' +
                '65 19 02 1D DB 1E 2F 25 56 EE EE 28 04 1F 00 07' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
        ],
    };

    return [
        cardWith16Punches,
        fullCard,
    ];
};
