import {describe, expect, test} from '@jest/globals';
import {proto} from '../../constants';
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {cropPunches, getPunchOffset, SiCard5} from './SiCard5';
import {getSiCard5Examples} from './siCard5Examples';
import {FakeSiCard5} from '../../fakes/FakeSiCard/types/FakeSiCard5';

describe('SiCard5', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(999)).not.toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(9999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(10000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(99999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(100000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(499999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(500000)).not.toEqual(SiCard5);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = SiCard5.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: [0x00, 0x00, 0x00, 0x01, 0x23, 0x45],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SiCard5).toBe(true);
            expect(instance.cardNumber).toBe(109029);
        });
        test('returns undefined when message has mode', () => {
            expect(SiCard5.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(SiCard5.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI5_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(SiCard5.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: [],
            })).toBe(undefined);
        });
    });
    test('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x21);
        expect(getPunchOffset(1)).toEqual(0x24);
        expect(getPunchOffset(2)).toEqual(0x27);
        expect(getPunchOffset(3)).toEqual(0x2A);
        expect(getPunchOffset(4)).toEqual(0x2D);
        expect(getPunchOffset(5)).toEqual(0x31);
        expect(getPunchOffset(9)).toEqual(0x3D);
        expect(getPunchOffset(10)).toEqual(0x41);
        expect(getPunchOffset(14)).toEqual(0x4D);
        expect(getPunchOffset(15)).toEqual(0x51);
        expect(getPunchOffset(19)).toEqual(0x5D);
        expect(getPunchOffset(20)).toEqual(0x61);
        expect(getPunchOffset(24)).toEqual(0x6D);
        expect(getPunchOffset(25)).toEqual(0x71);
        expect(getPunchOffset(29)).toEqual(0x7D);
        expect(getPunchOffset(30)).toEqual(0x20);
        expect(getPunchOffset(31)).toEqual(0x30);
        expect(getPunchOffset(32)).toEqual(0x40);
        expect(getPunchOffset(33)).toEqual(0x50);
        expect(getPunchOffset(34)).toEqual(0x60);
        expect(getPunchOffset(35)).toEqual(0x70);
    });
    test('cropPunches', () => {
        expect(cropPunches([])).toEqual([]);
        expect(cropPunches([
            {code: 31, time: 1},
        ])).toEqual([
            {code: 31, time: 1},
        ]);
        expect(cropPunches([
            {code: 0, time: 1},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: undefined, time: undefined},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: 33, time: undefined},
        ])).toEqual([
            {code: 33, time: undefined},
        ]);
        expect(cropPunches([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
            {code: 0, time: 4},
            {code: undefined, time: undefined},
        ])).toEqual([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
        ]);
    });
    test('typeSpecificRead fails without mainStation', (done) => {
        const mySiCard5 = new SiCard5(1);
        mySiCard5.typeSpecificRead().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
    const examples = getSiCard5Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myFakeSiCard5 = new FakeSiCard5(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = myFakeSiCard5.handleRequest(message);
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
            const mySiCard5 = new SiCard5(cardData.cardNumber);
            mySiCard5.mainStation = mainStationSimulation;
            mySiCard5.typeSpecificRead().then(() => {
                expect(mySiCard5.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard5.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard5.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard5.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard5.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard5.punchCount).toEqual(cardData.punchCount);
                done();
            });
        });

        test(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard5 = new SiCard5(cardData.cardNumber + 1);
            mySiCard5.mainStation = mainStationSimulation;
            mySiCard5.typeSpecificRead().then(() => {
                expect(mySiCard5.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard5.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard5.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard5.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard5.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard5.punchCount).toEqual(cardData.punchCount);
                done();
            });
        });
    });
});
