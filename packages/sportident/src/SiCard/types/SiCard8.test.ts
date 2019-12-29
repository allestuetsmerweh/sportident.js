/* eslint-env jasmine */

import _ from 'lodash';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';
import {ModernSiCardSeries} from './ModernSiCard';
import {getPunchOffset, SiCard8} from './SiCard8';
import {getSiCard8Examples} from './siCard8Examples';
import {FakeSiCard8} from '../../fakes/FakeSiCard/types/FakeSiCard8';

describe('SiCard8', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(2000000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2002999)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2004000)).toEqual(SiCard8);
        expect(BaseSiCard.getTypeByCardNumber(2999999)).toEqual(SiCard8);
    });
    it('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x88);
        expect(getPunchOffset(1)).toEqual(0x8C);
        expect(getPunchOffset(29)).toEqual(0xFC);
    });
    const examples = getSiCard8Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myFakeSiCard8 = new FakeSiCard8(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = myFakeSiCard8.handleRequest(message);
                if (responses.length !== numResponses) {
                    throw new Error('Invalid numResponses');
                }
                return Promise.resolve(responses.map((response: siProtocol.SiMessage) => (
                    response.mode === undefined ? [0x00, 0x00, ...response.parameters] : []
                )));
            },
        };

        it(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard8 = new SiCard8(cardData.cardNumber);
            mySiCard8.mainStation = mainStationSimulation;
            mySiCard8.typeSpecificRead().then(() => {
                expect(mySiCard8.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard8.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard8.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard8.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard8.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard8.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard8.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard8.uid).toEqual(cardData.uid);

                const cardSeriesString = mySiCard8.storage.get('cardSeries')!.toString();
                expect(cardSeriesString in ModernSiCardSeries).toBe(true);
                done();
            });
        });

        it(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard8 = new SiCard8(cardData.cardNumber + 1);
            mySiCard8.mainStation = mainStationSimulation;
            mySiCard8.typeSpecificRead().then(() => {
                expect(mySiCard8.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard8.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard8.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard8.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard8.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard8.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard8.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard8.uid).toEqual(cardData.uid);
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
