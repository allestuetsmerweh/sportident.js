import _ from 'lodash';
import * as utils from '../../utils';
import {type SiCardSample} from '../ISiCardExamples';

const cache = {};

const getFullTimesPage = utils.cached(
    cache,
    () => utils.unPrettyHex(`
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
        20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
    `),
);
const getNoTimesPage = utils.cached(
    cache,
    () => utils.unPrettyHex(`
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
    `),
);

export const getCardWith16Punches = utils.cached(
    cache,
    () => ({
        cardData: {
            uid: 0x772A4299,
            cardNumber: 2345678,
            startTime: 8721,
            finishTime: null,
            checkTime: 8735,
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
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                isComplete: true,
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                77 2A 42 99 EA EA EA EA 37 02 22 1F 07 03 22 11
                EE EE EE EE 0F 7F 10 09 0F 23 CA CE 06 0F 61 53
                61 3B 62 3B EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
            `),
            ...utils.unPrettyHex(`
                20 20 20 20 20 20 20 20 1F 1F 1F 1F 20 20 20 20
                21 21 21 21 22 22 22 22 23 23 23 23 24 24 24 24
                25 25 25 25 26 26 26 26 27 27 27 27 28 28 28 28
                29 29 29 29 2A 2A 2A 2A 2B 2B 2B 2B 2C 2C 2C 2C
                2D 2D 2D 2D 2E 2E 2E 2E EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
            `),
        ],
    }),
);

export const getFullCard = utils.cached(
    cache,
    () => ({
        cardData: {
            uid: 0x772A4299,
            cardNumber: 2345678,
            startTime: 8721,
            finishTime: 8481,
            checkTime: 8735,
            punchCount: 30,
            punches: _.range(30).map(() => ({code: 32, time: 8224})),
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                isComplete: true,
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                77 2A 42 99 EA EA EA EA 37 02 22 1F 07 03 22 11
                07 04 21 21 0F 7F 1E 09 0F 23 CA CE 06 0F 61 53
                61 3B 62 3B EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
            `),
            ...getFullTimesPage(),
        ],
    }),
);

export const getEmptyCard = utils.cached(
    cache,
    () => ({
        cardData: {
            uid: 0x772A4299,
            cardNumber: 2345678,
            startTime: 8721,
            finishTime: null,
            checkTime: 8735,
            punchCount: 0,
            punches: [],
            cardHolder: {
                firstName: undefined,
                lastName: undefined,
                isComplete: false,
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                77 2A 42 99 EA EA EA EA 37 02 22 1F 07 03 22 11
                EE EE EE EE 0F 7F 00 09 0F 23 CA CE 06 0F 61 53
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
            `),
            ...getNoTimesPage(),
        ],
    }),
);

export const getSiCard8Examples = (): {[name: string]: SiCardSample} => ({
    cardWith16Punches: getCardWith16Punches(),
    fullCard: getFullCard(),
    emptyCard: getEmptyCard(),
});
