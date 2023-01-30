import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import {proto} from '../../constants';
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {cropPunches, getPunchOffset, SiCard6} from './SiCard6';
import {getSiCard6Examples} from './siCard6Examples';
import {FakeSiCard6} from '../../fakes/FakeSiCard/types/FakeSiCard6';

describe('SiCard6', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(499999)).not.toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(500000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(999999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(1000000)).not.toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2002999)).not.toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003000)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2003999)).toEqual(SiCard6);
        expect(BaseSiCard.getTypeByCardNumber(2004000)).not.toEqual(SiCard6);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = SiCard6.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI6_DET,
                parameters: [0x00, 0x00, 0x00, 0x08, 0x88, 0x88],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SiCard6).toBe(true);
            expect(instance.cardNumber).toBe(559240);
        });
        test('returns undefined when message has mode', () => {
            expect(SiCard6.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(SiCard6.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI6_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(SiCard6.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI6_DET,
                parameters: [],
            })).toBe(undefined);
        });
    });
    test('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x300);
        expect(getPunchOffset(1)).toEqual(0x304);
        expect(getPunchOffset(63)).toEqual(0x3FC);
    });
    test('cropPunches', () => {
        expect(cropPunches([])).toEqual([]);
        expect(cropPunches([
            {code: 31, time: 1},
        ])).toEqual([
            {code: 31, time: 1},
        ]);
        expect(cropPunches([
            {code: 32, time: null},
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
            {code: 0xEE, time: null},
            {code: undefined, time: undefined},
        ])).toEqual([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
        ]);
    });
    test('typeSpecificRead fails without mainStation', (done) => {
        const mySiCard6 = new SiCard6(1);
        mySiCard6.typeSpecificRead().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
    const examples = getSiCard6Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myFakeSiCard6 = new FakeSiCard6(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = myFakeSiCard6.handleRequest(message);
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

        test(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard6 = new SiCard6(cardData.cardNumber);
            mySiCard6.mainStation = mainStationSimulation;
            mySiCard6.typeSpecificRead().then(() => {
                expect(mySiCard6.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard6.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard6.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard6.raceResult.clearTime).toEqual(cardData.clearTime);
                expect(mySiCard6.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard6.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard6.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard6.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard6.punchCountPlus1).toEqual(cardData.punchCountPlus1);
                expect(mySiCard6.lastPunchedCode).toEqual(cardData.lastPunchedCode);
                done();
            });
        });

        test(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard6 = new SiCard6(cardData.cardNumber + 1);
            mySiCard6.mainStation = mainStationSimulation;
            mySiCard6.typeSpecificRead().then(() => {
                expect(mySiCard6.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard6.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard6.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard6.raceResult.clearTime).toEqual(cardData.clearTime);
                expect(mySiCard6.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard6.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard6.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard6.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard6.punchCountPlus1).toEqual(cardData.punchCountPlus1);
                expect(mySiCard6.lastPunchedCode).toEqual(cardData.lastPunchedCode);
                done();
            });
        });
    });
    test('typeSpecificRead if typeSpecificReadCardHolder fails', (done) => {
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
    test('typeSpecificRead if typeSpecificReadPunches fails', (done) => {
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
