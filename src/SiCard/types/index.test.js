/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import * as siCardIndex from './index';

describe('SiCard index', () => {
    it('every card type has been registered', () => {
        const cardTypesInRegistry = BaseSiCard._cardNumberRangeRegistry.values;
        Object.values(siCardIndex.siCardTypes).forEach((cardType) => {
            expect(cardTypesInRegistry.includes(cardType)).toBe(true);
        });
    });
    const bytesPerPage = 128;
    const cardTypes = Object.values(siCardIndex.siCardTypes);
    cardTypes.forEach((cardType) => {
        it(`test ${cardType.name} with respective test data`, (done) => {
            const testData = cardType.getTestData();
            const testAtIndex = (testDataIndex) => {
                if (testDataIndex >= testData.length) {
                    done();
                    return;
                }
                const {storageData, cardData} = testData[testDataIndex];
                const mySiCard = new cardType(cardData.cardNumber);
                mySiCard.mainStation = {
                    sendMessage: ({_command, parameters}, numResponses) => {
                        const getPage = (pageNumber) => [
                            ...[0x00, 0x00],
                            ...(pageNumber === undefined ? [] : [pageNumber]),
                            ...storageData.slice(
                                (pageNumber || 0) * bytesPerPage,
                                ((pageNumber || 0) + 1) * bytesPerPage,
                            ),
                        ];
                        const pageNumbersToGet = parameters[0] === 0x08 ? [0, 6, 7] : [parameters[0]];
                        if (numResponses !== pageNumbersToGet.length) {
                            throw new Error(`Invalid numResponses ${numResponses} (expected ${pageNumbersToGet.length})`);
                        }
                        return Promise.resolve(pageNumbersToGet.map(getPage));
                    },
                };

                mySiCard.typeSpecificRead().then(() => {
                    Object.keys(cardData).forEach((cardDataKey) => {
                        expect(mySiCard[cardDataKey]).toEqual(cardData[cardDataKey]);
                    });
                    testAtIndex(testDataIndex + 1);
                });
            };
            testAtIndex(0);
        });
    });
});
