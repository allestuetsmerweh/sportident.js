/* eslint-env jasmine */

import {BaseSiCard} from '../BaseSiCard';
import {SiCard9} from './SiCard9';
import {getSiCard9Examples} from './siCard9Examples';
import {SiCard9Simulator} from '../../simulation/SiCardSimulator/types/SiCard9Simulator';

describe('SiCard9', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(1000000)).toEqual(SiCard9);
        expect(BaseSiCard.getTypeByCardNumber(1999999)).toEqual(SiCard9);
    });
    it('getPunchOffset', () => {
        expect(SiCard9.getPunchOffset(0)).toEqual(0x38);
        expect(SiCard9.getPunchOffset(1)).toEqual(0x3C);
        expect(SiCard9.getPunchOffset(49)).toEqual(0xFC);
    });
    const examples = getSiCard9Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myModernSiCardSimulator = new SiCard9Simulator(storageData);
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
            const mySiCard9 = new SiCard9(cardData.cardNumber);
            mySiCard9.mainStation = mainStationSimulation;
            mySiCard9.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard9[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                const cardSeriesString = mySiCard9.storage.get('cardSeries').toString();
                expect(SiCard9.Series[cardSeriesString]).not.toBe(undefined);
                done();
            });
        });

        it(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard9 = new SiCard9(cardData.cardNumber + 1);
            mySiCard9.mainStation = mainStationSimulation;
            mySiCard9.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard9[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                done();
            });
        });
    });
    it('typeSpecificRead if typeSpecificGetPage fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage = false;
        class ModernSiCardWithoutCardHolder extends SiCard9 {
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
