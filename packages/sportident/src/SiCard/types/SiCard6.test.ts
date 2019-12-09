/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {cropPunches, getPunchOffset, SiCard6} from './SiCard6';
import {getSiCard6Examples} from './siCard6Examples';
import {SiCard6Simulator} from '../../simulation/SiCardSimulator/types/SiCard6Simulator';

describe('SiCard6', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(500000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(999999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003999)).toEqual(SiCard6);
    });
    it('typeSpecificShouldDetectFromMessage works', () => {
        expect(SiCard6.typeSpecificShouldDetectFromMessage({
            command: proto.cmd.SI6_DET,
            parameters: [],
        })).toBe(true);
        expect(SiCard6.typeSpecificShouldDetectFromMessage({
            command: testUtils.getRandomByteExcept([proto.cmd.SI6_DET]),
            parameters: [],
        })).toBe(false);
    });
    it('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x300);
        expect(getPunchOffset(1)).toEqual(0x304);
        expect(getPunchOffset(63)).toEqual(0x3FC);
    });
    it('cropPunches', () => {
        expect(cropPunches([])).toEqual([]);
        expect(cropPunches([
            {code: 31, time: 1},
        ])).toEqual([
            {code: 31, time: 1},
        ]);
        expect(cropPunches([
            {code: 32, time: 0xEEEE},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: undefined, time: undefined},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: 33, time: undefined},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
            {code: 0xEE, time: 0xEEEE},
            {code: undefined, time: undefined},
        ])).toEqual([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
        ]);
    });
    const examples = getSiCard6Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const mySiCard6Simulator = new SiCard6Simulator(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = mySiCard6Simulator.handleRequest(message);
                if (responses.length !== numResponses) {
                    throw new Error('Invalid numResponses');
                }
                return Promise.resolve(responses.map(
                    (response: siProtocol.SiMessage) => (
                        response.mode === undefined ? [0x00, 0x00, ...response.parameters] : []
                    ),
                ));
            },
        };

        it(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard6 = new SiCard6(cardData.cardNumber);
            mySiCard6.mainStation = mainStationSimulation;
            mySiCard6.typeSpecificRead().then(() => {
                expect(mySiCard6.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard6.startTime).toEqual(cardData.startTime);
                expect(mySiCard6.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard6.clearTime).toEqual(cardData.clearTime);
                expect(mySiCard6.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard6.lastPunchedCode).toEqual(cardData.lastPunchedCode);
                expect(mySiCard6.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard6.punchCountPlus1).toEqual(cardData.punchCountPlus1);
                expect(mySiCard6.punches).toEqual(cardData.punches);
                expect(mySiCard6.cardHolder).toEqual(cardData.cardHolder);
                done();
            });
        });

        it(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard6 = new SiCard6(cardData.cardNumber + 1);
            mySiCard6.mainStation = mainStationSimulation;
            mySiCard6.typeSpecificRead().then(() => {
                expect(mySiCard6.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard6.startTime).toEqual(cardData.startTime);
                expect(mySiCard6.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard6.clearTime).toEqual(cardData.clearTime);
                expect(mySiCard6.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard6.lastPunchedCode).toEqual(cardData.lastPunchedCode);
                expect(mySiCard6.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard6.punchCountPlus1).toEqual(cardData.punchCountPlus1);
                expect(mySiCard6.punches).toEqual(cardData.punches);
                expect(mySiCard6.cardHolder).toEqual(cardData.cardHolder);
                done();
            });
        });
    });
    it('typeSpecificRead if typeSpecificReadCardHolder fails', (done) => {
        const testError = new Error('test');
        let typeSpecificReadCardHolderCalled = false;
        class SiCard6WithoutCardHolder extends SiCard6 {
            typeSpecificGetPage() {
                return Promise.resolve(_.range(128).map(() => 0x00));
            }

            typeSpecificReadCardHolder() {
                typeSpecificReadCardHolderCalled = true;
                return Promise.reject(testError);
            }
        }
        const mySiCard6 = new SiCard6WithoutCardHolder(654321);
        mySiCard6.typeSpecificRead()
            .catch((err) => {
                expect(typeSpecificReadCardHolderCalled).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
    it('typeSpecificRead if typeSpecificReadPunches fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage6 = false;
        class SiCard6WithoutCardHolder extends SiCard6 {
            typeSpecificGetPage(pageNumber: number) {
                if (pageNumber === 6) {
                    attemptedToGetPage6 = true;
                    return Promise.reject(testError);
                }
                return Promise.resolve(_.range(128).map(() => 0x01));
            }
        }
        const myModernSiCard = new SiCard6WithoutCardHolder(7123456);
        myModernSiCard.typeSpecificRead()
            .catch((err) => {
                expect(attemptedToGetPage6).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
});
