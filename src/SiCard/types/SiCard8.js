import _ from 'lodash';
import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}

export class SiCard8 extends ModernSiCard {
    typeSpecificRead() {
        const punchesPerPage = 32;
        const bytesPerPage = 128;
        return new Promise((resolve, reject) => {
            this.modernGetPage(0)
                .then((page0) => {
                    this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                    if (this.cardNumber !== this.storage.get('cardNumber')) {
                        console.warn(`SICard8 Number ${this.storage.get('cardNumber')} (expected ${this.cardNumber})`);
                    }

                    if (this.storage.get('punchCount') <= punchesPerPage * 0) {
                        throw new ReadFinishedException();
                    }
                    return this.modernGetPage(1);
                })
                .then((page1) => {
                    this.storage.splice(bytesPerPage * 1, bytesPerPage, ...page1);
                    throw new ReadFinishedException();
                })
                .catch((exc) => {
                    if (exc instanceof ReadFinishedException) {
                        Object.keys(this.constructor.StorageDefinition.definitions).forEach((key) => {
                            this[key] = this.storage.get(key);
                        });
                        resolve(this);
                    } else {
                        reject(exc);
                    }
                });
        });
    }
}
BaseSiCard.registerNumberRange(2000000, 2003000, SiCard8);
BaseSiCard.registerNumberRange(2004000, 3000000, SiCard8);

SiCard8.StorageDefinition = utils.defineStorage(0x100, {
    cardNumber: new utils.SiArray(
        3,
        (i) => new utils.SiInt([[25 + (2 - i)]]),
    ).modify(
        (extractedValue) => siProtocol.arr2cardNumber(extractedValue),
        (cardNumber) => siProtocol.cardNumber2arr(cardNumber),
    ),
    startTime: new utils.SiInt([[14], [15]]),
    finishTime: new utils.SiInt([[18], [19]]),
    checkTime: new utils.SiInt([[10], [11]]),
    punchCount: new utils.SiInt([[22]]),
    punches: new utils.SiArray(30, (i) => new utils.SiDict({
        code: new utils.SiInt([[136 + i * 4 + 1]]),
        time: new utils.SiInt([[136 + i * 4 + 2], [136 + i * 4 + 3]]),
    })).modify(
        (allPunches) => {
            const isPunchEntryInvalid = (punch) => punch.time === undefined || punch.time === 0xEEEE;
            const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
            return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
        },
    ),
});

SiCard8.getTestData = () => {
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

    const cardWith16Punches = {
        cardData: {
            cardNumber: 1234567,
            startTime: 4386,
            finishTime: 61166,
            checkTime: 7970,
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
                '77 2A 42 99 EA EA EA EA 37 02 22 1F 07 03 22 11' +
                'EE EE EE EE 0F 7F 10 09 0F 12 D6 87 06 0F 61 53' +
                '53 69 6D 6F 6E 3B 48 61 74 74 3B 6D 3B 31 39 39' +
                '32 3B 4F 4C 20 5A 69 6D 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            ...utils.unPrettyHex(
                '20 20 20 20 20 20 20 20 1F 1F 1F 1F 20 20 20 20' +
                '21 21 21 21 22 22 22 22 23 23 23 23 24 24 24 24' +
                '25 25 25 25 26 26 26 26 27 27 27 27 28 28 28 28' +
                '29 29 29 29 2A 2A 2A 2A 2B 2B 2B 2B 2C 2C 2C 2C' +
                '2D 2D 2D 2D 2E 2E 2E 2E EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE',
            ),
        ],
    };

    const fullCard = {
        cardData: {
            cardNumber: 1234567,
            startTime: 4386,
            finishTime: 61166,
            checkTime: 7970,
            punchCount: 30,
            punches: _.range(30).map(() => ({code: 32, time: 8224})),
        },
        storageData: [
            ...utils.unPrettyHex(
                '77 2a 42 99 ea ea ea ea 37 02 22 1f 07 03 22 11' +
                'ee ee ee ee 0f 7f 1E 09 0f 12 d6 87 06 0f 61 53' +
                '53 69 6d 6f 6e 3b 48 61 74 74 3b 6d 3b 31 39 39' +
                '32 3b 4f 4c 20 5a 69 6d 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
                '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
            ),
            ...fullTimesPage,
        ],
    };

    return [
        cardWith16Punches,
        fullCard,
    ];
};
