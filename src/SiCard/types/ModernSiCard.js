import _ from 'lodash';
import {proto} from '../../constants';
import * as utils from '../../utils';
import * as siStorageAccess from '../../siStorageAccess';
import {BaseSiCard} from '../BaseSiCard';

class ReadFinishedException {}

export class ModernSiCard extends BaseSiCard {
    getTypeSpecificDetectionMessage() {
        const cardNumberArr = utils.cardNumber2arr(this.cardNumber);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI8_DET,
            parameters: [...cardNumberArr],
        };
    }

    modernGetPage(pageNumber) {
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

    modernRead() {
        const punchesPerPage = 32;
        const bytesPerPage = 128;
        return new Promise((resolve, reject) => {
            this.modernGetPage(0)
                .then((page0) => {
                    this.storage.splice(bytesPerPage * 0, bytesPerPage, ...page0);

                    if (this.cardNumber !== this.storage.get('cardNumber')) {
                        console.warn(`ModernSICard Number ${this.storage.get('cardNumber')} (expected ${this.cardNumber})`);
                    }

                    if (this.storage.get('punchCount') <= punchesPerPage * 0) {
                        throw new ReadFinishedException();
                    }
                    return this.modernGetPage(4);
                })
                .then((page4) => {
                    this.storage.splice(bytesPerPage * 4, bytesPerPage, ...page4);
                    if (this.storage.get('punchCount') <= punchesPerPage * 1) {
                        throw new ReadFinishedException();
                    }
                    return this.modernGetPage(5);
                })
                .then((page5) => {
                    this.storage.splice(bytesPerPage * 5, bytesPerPage, ...page5);
                    if (this.storage.get('punchCount') <= punchesPerPage * 2) {
                        throw new ReadFinishedException();
                    }
                    return this.modernGetPage(6);
                })
                .then((page6) => {
                    this.storage.splice(bytesPerPage * 6, bytesPerPage, ...page6);
                    if (this.storage.get('punchCount') <= punchesPerPage * 3) {
                        throw new ReadFinishedException();
                    }
                    return this.modernGetPage(7);
                })
                .then((page7) => {
                    this.storage.splice(bytesPerPage * 7, bytesPerPage, ...page7);
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

ModernSiCard.StorageDefinition = siStorageAccess.define(0x400, {
    cardNumber: new siStorageAccess.SiArray(
        3,
        (i) => new siStorageAccess.SiInt([[25 + (2 - i)]]),
    ).modify(
        (extractedValue) => utils.arr2cardNumber(extractedValue),
        (cardNumber) => utils.cardNumber2arr(cardNumber),
    ),
    startTime: new siStorageAccess.SiInt([[14], [15]]),
    finishTime: new siStorageAccess.SiInt([[18], [19]]),
    checkTime: new siStorageAccess.SiInt([[10], [11]]),
    punchCount: new siStorageAccess.SiInt([[22]]),
    punches: new siStorageAccess.SiArray(128, (i) => new siStorageAccess.SiDict({
        code: new siStorageAccess.SiInt([[128 * 4 + i * 4 + 1]]),
        time: new siStorageAccess.SiInt([[128 * 4 + i * 4 + 2], [128 * 4 + i * 4 + 3]]),
    })).modify(
        (allPunches) => {
            const isPunchEntryInvalid = (punch) => punch.time === undefined || punch.time === 0xEEEE;
            const firstInvalidIndex = allPunches.findIndex(isPunchEntryInvalid);
            return firstInvalidIndex === -1 ? allPunches : allPunches.slice(0, firstInvalidIndex);
        },
    ),
});

ModernSiCard.getTestData = () => {
    const emptyPage = utils.unPrettyHex(
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20' +
        '20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20',
    );
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
            cardNumber: 7050892,
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
                'EE EE EE EE 0F 7F 10 09 0F 6B 96 8C 06 0F 61 53' +
                '53 69 6D 6F 6E 3B 48 61 74 74 3B 6D 3B 31 39 39' +
                '32 3B 4F 4C 20 5A 69 6D 6D 65 72 62 65 72 67 3B' +
                '3B 3B 5A 81 72 69 63 68 3B 3B 3B 53 55 49 3B 00' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE',
            ),
            ...emptyPage,
            ...emptyPage,
            ...emptyPage,
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
            ...noTimesPage,
            ...noTimesPage,
        ],
    };

    const fullCard = {
        cardData: {
            cardNumber: 7050892,
            startTime: 4386,
            finishTime: 61166,
            checkTime: 7970,
            punchCount: 128,
            punches: _.range(128).map(() => ({code: 32, time: 8224})),
        },
        storageData: [
            ...utils.unPrettyHex(
                '77 2A 42 99 EA EA EA EA 37 02 22 1F 07 03 22 11' +
                'EE EE EE EE 0F 7F 80 09 0F 6B 96 8C 06 0F 61 53' +
                '53 69 6D 6F 6E 3B 48 61 74 74 3B 6D 3B 31 39 39' +
                '32 3B 4F 4C 20 5A 69 6D 6D 65 72 62 65 72 67 3B' +
                '3B 3B 5A 81 72 69 63 68 3B 3B 3B 53 55 49 3B 00' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE' +
                'EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE',
            ),
            ...emptyPage,
            ...emptyPage,
            ...emptyPage,
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
