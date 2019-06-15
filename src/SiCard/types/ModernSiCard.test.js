/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
import * as utils from '../../utils';
import {ModernSiCard} from './ModernSiCard';

describe('ModernSiCard', () => {
    it('exists', () => {
        expect(ModernSiCard).not.toBe(undefined);

        const myModernSiCard = new ModernSiCard();
        expect(myModernSiCard.storage.data.has(0)).toBe(true);
        expect(myModernSiCard.storage.data.get(0)).toBe(undefined);
        expect(myModernSiCard.storage.data.has(1023)).toBe(true);
        expect(myModernSiCard.storage.data.get(1023)).toBe(undefined);
        expect(myModernSiCard.storage.data.has(1024)).toBe(false);
        expect(myModernSiCard.storage.data.get(1024)).toBe(undefined);
    });
    it('getTypeSpecificDetectionMessage works', () => {
        const myModernSiCard = new ModernSiCard(7050892);
        expect(myModernSiCard.getTypeSpecificDetectionMessage()).toEqual({
            command: proto.cmd.SI8_DET,
            parameters: utils.unPrettyHex('00 6B 96 8C'), // TODO: actually, it should be 00 02 0F 6B 96 8C
        });
    });
    it('modernRead', (done) => {
        const bytesPerPage = 128;
        const testData = ModernSiCard.getTestData();
        const testAtIndex = (index) => {
            const {storageData, cardData} = testData[index];
            const myModernSiCard = new ModernSiCard(cardData.cardNumber);
            myModernSiCard.mainStation = {
                sendMessage: ({command, parameters}, numResponses) => {
                    if (command !== proto.cmd.GET_SI8) {
                        throw new Error('Invalid command');
                    }
                    if (numResponses !== 1) {
                        throw new Error('Invalid numResponses');
                    }
                    const pageNumberToGet = parameters[0];
                    const getPage = (pageNumber) => [
                        ...[0x00, 0x00, pageNumber],
                        ...storageData.slice(
                            pageNumber * bytesPerPage,
                            (pageNumber + 1) * bytesPerPage,
                        ),
                    ];
                    return Promise.resolve([getPage(pageNumberToGet)]);
                },
            };

            myModernSiCard.modernRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(myModernSiCard[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                if (index + 1 < testData.length) {
                    testAtIndex(index + 1);
                } else {
                    done();
                }
            });
        };
        testAtIndex(0);
    });
});
