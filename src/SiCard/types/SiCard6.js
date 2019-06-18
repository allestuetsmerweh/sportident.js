import _ from 'lodash';
import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard6 extends BaseSiCard {
    getTypeSpecificDetectionMessage() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.cardNumber);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI6_DET,
            parameters: [...cardNumberArr],
        };
    }

    typeSpecificRead() {
        const bytesPerPage = 128;
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SI6,
            parameters: [0x08],
        }, 3)
            .then((data) => {
                if (data[0][2] !== 0) {
                    console.warn(`SICard6 Error: First read block is ${data[0][2]} (expected 0)`);
                }
                if (data[1][2] !== 6) {
                    console.warn(`SICard6 Error: Second read block is ${data[1][2]} (expected 6)`);
                }
                if (data[2][2] !== 7) {
                    console.warn(`SICard6 Error: Third read block is ${data[2][2]} (expected 7)`);
                }
                this.storage.splice(bytesPerPage * 0, bytesPerPage, ...data[0].slice(3));
                this.storage.splice(bytesPerPage * 6, bytesPerPage, ...data[1].slice(3));
                this.storage.splice(bytesPerPage * 7, bytesPerPage, ...data[2].slice(3));

                if (this.cardNumber !== this.storage.get('cardNumber')) {
                    console.warn(`SICard6 Number ${this.storage.get('cardNumber')} (expected ${this.cardNumber})`);
                }

                Object.keys(this.constructor.StorageDefinition.definitions).forEach((key) => {
                    this[key] = this.storage.get(key);
                });
            });
    }
}
BaseSiCard.registerNumberRange(500000, 1000000, SiCard6);
BaseSiCard.registerNumberRange(2003000, 2004000, SiCard6);

SiCard6.StorageDefinition = utils.defineStorage(0x400, {
    cardNumber: new utils.SiArray(
        3,
        (i) => new utils.SiInt([[11 + (2 - i)]]),
    ).modify(
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
    ),
    startTime: new utils.SiInt([[26], [27]]),
    finishTime: new utils.SiInt([[22], [23]]),
    checkTime: new utils.SiInt([[30], [31]]),
    clearTime: new utils.SiInt([[34], [35]]),
    punchCount: new utils.SiInt([[18]]).modify( // TODO: verify modification
        (extractedValue) => extractedValue - 1,
        (punchCount) => punchCount + 1,
    ),
    punches: new utils.SiArray(64, (i) => new utils.SiDict({
        code: new utils.SiInt([[128 * 6 + i * 4 + 1]]),
        time: new utils.SiInt([[128 * 6 + i * 4 + 2], [128 * 6 + i * 4 + 3]]),
    })).modify(
        (allPunches) => {
            const isPunchEntryInvalid = (punch) => punch.time === undefined || punch.time === 0xEEEE;
            const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
            return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
        },
    ),
});

SiCard6.getTestData = () => {
    const fullTimesPage = utils.unPrettyHex(
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
    );
    const noTimesPage = utils.unPrettyHex(
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
        'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE',
    );

    const cardWith16Punches = {
        cardData: {
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
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
                '01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B' +
                '00 5B 11 41 00 0A 28 0A 03 0A 95 99 03 0A 95 8B' +
                '03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20' +
                '5A 69 6D 6D 65 72 62 65 72 67 20 20 20 20 20 20' +
                '20 20 20 20 4F 4C 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...utils.unPrettyHex(
                '1F 1F 1F 1F 20 20 20 20 21 21 21 21 22 22 22 22' +
                '23 23 23 23 24 24 24 24 25 25 25 25 26 26 26 26' +
                '27 27 27 27 28 28 28 28 29 29 29 29 2A 2A 2A 2A' +
                '2B 2B 2B 2B 2C 2C 2C 2C 2D 2D 2D 2D 2E 2E 2E 2E' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE',
            ),
            ...noTimesPage,
        ],
    };

    const fullCard = {
        cardData: {
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
            punchCount: 63,
            punches: _.range(64).map(() => ({code: 32, time: 8224})),
        },
        storageData: [
            ...utils.unPrettyHex(
                '01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B' +
                '00 5B 40 41 00 0A 28 0A 03 0A 95 99 03 0A 95 8B' +
                '03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20' +
                '5A 69 6D 6D 65 72 62 65 72 67 20 20 20 20 20 20' +
                '20 20 20 20 4F 4C 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
            ...fullTimesPage,
        ],
    };

    return [
        cardWith16Punches,
        fullCard,
    ];
};
