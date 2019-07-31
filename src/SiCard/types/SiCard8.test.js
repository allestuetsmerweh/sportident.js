/* eslint-env jasmine */

import _ from 'lodash';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard8} from './SiCard8';
import {getSiCard8Examples} from './siCard8Examples';
import {SiCard8Simulator} from '../../simulation/SiCardSimulator/types/SiCard8Simulator';

describe('SiCard8', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(2000000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2002999)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2004000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2999999)).toEqual(SiCard8);
    });
    it('getPunchOffset', () => {
        expect(SiCard8.getPunchOffset(0)).toEqual(0x88);
        expect(SiCard8.getPunchOffset(1)).toEqual(0x8C);
        expect(SiCard8.getPunchOffset(29)).toEqual(0xFC);
    });
    const examples = getSiCard8Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myModernSiCardSimulator = new SiCard8Simulator(storageData);
        const mainStationSimulation = {
            sendMessage: (message, numResponses) => {
                const responses = myModernSiCardSimulator.handleRequest(message);
                if (responses.length !== numResponses) {
                    throw new Error('Invalid numResponses');
                }
                return Promise.resolve(responses.map((response) => [0x00, 0x00, ...response.parameters]));
            },
        };

        it(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard8 = new SiCard8(cardData.cardNumber);
            mySiCard8.mainStation = mainStationSimulation;
            mySiCard8.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard8[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                const cardSeriesString = mySiCard8.storage.get('cardSeries').toString();
                expect(SiCard8.Series[cardSeriesString]).not.toBe(undefined);
                done();
            });
        });

        it(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard8 = new SiCard8(cardData.cardNumber + 1);
            mySiCard8.mainStation = mainStationSimulation;
            mySiCard8.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard8[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                done();
            });
        });
    });
    it('typeSpecificRead if typeSpecificGetPage fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage = false;
        class ModernSiCardWithoutCardHolder extends SiCard8 {
            typeSpecificGetPage() {
                attemptedToGetPage = true;
                return Promise.reject(testError);
            }
        }
        const myModernSiCard = new ModernSiCardWithoutCardHolder(7123456);
        myModernSiCard.typeSpecificRead()
            .catch((err) => {
                expect(attemptedToGetPage).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
});
