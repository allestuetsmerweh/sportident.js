import _ from 'lodash';
import * as utils from '../../utils';
import {SiCardSample} from '../ISiCardExamples';

const cache = {};

const getUnknownPage = utils.cached(
    cache,
    () => _.range(128).map(() => undefined),
);
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
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
            lastPunchedCode: 46,
            punchCount: 16,
            punchCountPlus1: 17,
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
                gender: 'c',
                birthday: 'd',
                club: 'e',
                email: 'f',
                phone: 'g',
                city: 'h',
                street: 'i',
                zip: 'j',
                country: 'k',
                userId: 'l',
                isComplete: 'non-falsy',
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B
                00 2E 10 11 00 0A 28 0A 03 0A 95 99 03 0A 95 8B
                03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20
                62 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 61 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 6B 20 20 20 65 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
            `),
            ...utils.unPrettyHex(`
                6C 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                67 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                66 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 69 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 68 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 6A 20 20 20 20 20 20 20
                63 20 20 20 64 20 20 20 20 20 20 20 20 20 20 20
            `),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...utils.unPrettyHex(`
                1F 1F 1F 1F 20 20 20 20 21 21 21 21 22 22 22 22
                23 23 23 23 24 24 24 24 25 25 25 25 26 26 26 26
                27 27 27 27 28 28 28 28 29 29 29 29 2A 2A 2A 2A
                2B 2B 2B 2B 2C 2C 2C 2C 2D 2D 2D 2D 2E 2E 2E 2E
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
                EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
            `),
            ...getNoTimesPage(),
        ],
    }),
);

export const getFullCard = utils.cached(
    cache,
    () => ({
        cardData: {
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
            lastPunchedCode: 32,
            punchCount: 64,
            punchCountPlus1: 65,
            punches: _.range(64).map(() => ({code: 32, time: 8224})),
            cardHolder: {
                firstName: 'aaaaaaaaaaaaaaaaaaaa',
                lastName: 'bbbbbbbbbbbbbbbbbbbb',
                gender: 'cccc',
                birthday: 'dddddddd',
                club: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                email: 'ffffffffffffffffffffffffffffffffffff',
                phone: 'gggggggggggggggg',
                city: 'hhhhhhhhhhhhhhhh',
                street: 'iiiiiiiiiiiiiiiiiiii',
                zip: 'jjjjjjjj',
                country: 'kkkk',
                userId: 'llllllllllllllll',
                isComplete: 'non-falsy',
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B
                00 20 40 41 00 0A 28 0A 03 0A 95 99 03 0A 95 8B
                03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20
                62 62 62 62 62 62 62 62 62 62 62 62 62 62 62 62
                62 62 62 62 61 61 61 61 61 61 61 61 61 61 61 61
                61 61 61 61 61 61 61 61 6B 6B 6B 6B 65 65 65 65
                65 65 65 65 65 65 65 65 65 65 65 65 65 65 65 65
                65 65 65 65 65 65 65 65 65 65 65 65 65 65 65 65
            `),
            ...utils.unPrettyHex(`
                6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C 6C
                67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67
                66 66 66 66 66 66 66 66 66 66 66 66 66 66 66 66
                66 66 66 66 66 66 66 66 66 66 66 66 66 66 66 66
                66 66 66 66 69 69 69 69 69 69 69 69 69 69 69 69
                69 69 69 69 69 69 69 69 68 68 68 68 68 68 68 68
                68 68 68 68 68 68 68 68 6A 6A 6A 6A 6A 6A 6A 6A
                63 63 63 63 64 64 64 64 64 64 64 64 20 20 20 20
            `),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getFullTimesPage(),
            ...getFullTimesPage(),
        ],
    }),
);

export const getPartialCardHolderCard = utils.cached(
    cache,
    () => ({
        cardData: {
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
            lastPunchedCode: 32,
            punchCount: 64,
            punchCountPlus1: 65,
            punches: _.range(64).map(() => ({code: 32, time: 8224})),
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                club: 'e',
                country: 'k',
                isComplete: '',
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B
                00 20 40 41 00 0A 28 0A 03 0A 95 99 03 0A 95 8B
                03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20
                62 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 61 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 6B 20 20 20 65 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
            `),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getFullTimesPage(),
            ...getFullTimesPage(),
        ],
    }),
);

export const getEmptyCard = utils.cached(
    cache,
    () => ({
        cardData: {
            cardNumber: 500029,
            startTime: 39317,
            finishTime: 2600,
            clearTime: 30357,
            checkTime: 35733,
            lastPunchedCode: 32,
            punchCount: 0,
            punchCountPlus1: 1,
            punches: [],
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                club: 'e',
                country: 'k',
                isComplete: '',
            },
        },
        storageData: [
            ...utils.unPrettyHex(`
                01 01 01 01 ED ED ED ED 55 AA 00 07 A1 3D 6E 8B
                00 20 00 01 00 0A 28 0A 03 0A 95 99 03 0A 95 8B
                03 0A 95 76 FF FF FF FF 00 00 00 01 20 20 20 20
                62 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 61 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 6B 20 20 20 65 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
                20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20
            `),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getUnknownPage(),
            ...getNoTimesPage(),
            ...getNoTimesPage(),
        ],
    }),
);

export const getSiCard6Examples = (): {[name: string]: SiCardSample} => ({
    cardWith16Punches: getCardWith16Punches(),
    fullCard: getFullCard(),
    partialCardHolderCard: getPartialCardHolderCard(),
    emptyCard: getEmptyCard(),
});
