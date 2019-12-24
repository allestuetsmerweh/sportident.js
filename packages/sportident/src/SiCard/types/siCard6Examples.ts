import _ from 'lodash';
import * as utils from '../../utils';
// eslint-disable-next-line no-unused-vars
import {SiCardSample} from '../ISiCardExamples';

const cache = {};

const getUnknownPage = utils.cached(
    cache,
    () => _.range(128).map(() => undefined),
);
const getFullTimesPage1 = utils.cached(
    cache,
    () => utils.unPrettyHex(`
        20 01 00 01 20 02 00 02 20 03 00 03 20 04 00 04
        20 05 01 01 20 06 01 02 20 07 01 03 20 08 01 04
        20 09 02 01 20 0A 02 02 20 0B 02 03 20 0C 02 04
        20 0D 03 01 20 0E 03 02 20 0F 03 03 20 10 03 04
        20 11 04 01 20 12 04 02 20 13 04 03 20 14 04 04
        20 15 05 01 20 16 05 02 20 17 05 03 20 18 05 04
        20 19 06 01 20 1A 06 02 20 1B 06 03 20 1C 06 04
        20 1D 07 01 20 1E 07 02 20 1F 07 03 20 20 07 04
    `),
);
const getFullTimesPage2 = utils.cached(
    cache,
    () => utils.unPrettyHex(`
        20 21 08 01 20 22 08 02 20 23 08 03 20 24 08 04
        20 25 09 01 20 26 09 02 20 27 09 03 20 28 09 04
        20 29 0A 01 20 2A 0A 02 20 2B 0A 03 20 2C 0A 04
        20 2D 0B 01 20 2E 0B 02 20 2F 0B 03 20 30 0B 04
        20 31 0C 01 20 32 0C 02 20 33 0C 03 20 34 0C 04
        20 35 0D 01 20 36 0D 02 20 37 0D 03 20 38 0D 04
        20 39 0E 01 20 3A 0E 02 20 3B 0E 03 20 3C 0E 04
        20 3D 0F 01 20 3E 0F 02 20 3F 0F 03 20 40 0F 04
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
            startTime: 38297,
            finishTime: 10250,
            clearTime: 38262,
            checkTime: 38283,
            lastPunchedCode: 46,
            punchCount: 16,
            punchCountPlus1: 17,
            punches: _.range(16).map((index: number) => ({
                code: index + 1,
                time: Math.floor(index / 4) * (256 - 4) + index + 1,
            })),
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
                isComplete: true,
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
                20 01 00 01 20 02 00 02 20 03 00 03 20 04 00 04
                20 05 01 01 20 06 01 02 20 07 01 03 20 08 01 04
                20 09 02 01 20 0A 02 02 20 0B 02 03 20 0C 02 04
                20 0D 03 01 20 0E 03 02 20 0F 03 03 20 10 03 04
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
            startTime: 38297,
            finishTime: 10250,
            clearTime: 38262,
            checkTime: 38283,
            lastPunchedCode: 32,
            punchCount: 64,
            punchCountPlus1: 65,
            punches: _.range(64).map((index: number) => ({
                code: index + 1,
                time: Math.floor(index / 4) * (256 - 4) + index + 1,
            })),
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
                isComplete: true,
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
            ...getFullTimesPage1(),
            ...getFullTimesPage2(),
        ],
    }),
);

export const getPartialCardHolderCard = utils.cached(
    cache,
    () => ({
        cardData: {
            cardNumber: 500029,
            startTime: 38297,
            finishTime: 10250,
            clearTime: 38262,
            checkTime: 38283,
            lastPunchedCode: 32,
            punchCount: 64,
            punchCountPlus1: 65,
            punches: _.range(64).map((index: number) => ({
                code: index + 1,
                time: Math.floor(index / 4) * (256 - 4) + index + 1,
            })),
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                club: 'e',
                country: 'k',
                isComplete: false,
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
            ...getFullTimesPage1(),
            ...getFullTimesPage2(),
        ],
    }),
);

export const getEmptyCard = utils.cached(
    cache,
    () => ({
        cardData: {
            cardNumber: 500029,
            startTime: 38297,
            finishTime: 10250,
            clearTime: 38262,
            checkTime: 38283,
            lastPunchedCode: 32,
            punchCount: 0,
            punchCountPlus1: 1,
            punches: [],
            cardHolder: {
                firstName: 'a',
                lastName: 'b',
                club: 'e',
                country: 'k',
                isComplete: false,
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
