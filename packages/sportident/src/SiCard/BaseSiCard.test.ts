import {describe, expect, test} from '@jest/globals';
import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import {BaseSiCard} from './BaseSiCard';

beforeEach(() => {
    BaseSiCard.resetNumberRangeRegistry();
});

describe('BaseSiCard', () => {
    class FakeSiCard1 extends BaseSiCard {
        static typeSpecificInstanceFromMessage(_message: siProtocol.SiMessage): FakeSiCard1|undefined {
            return undefined;
        }

        typeSpecificRead() {
            return Promise.resolve();
        }
    }
    class FakeSiCard2 extends BaseSiCard {
        static typeSpecificInstanceFromMessage(_message: siProtocol.SiMessage): FakeSiCard2|undefined {
            return undefined;
        }

        typeSpecificRead() {
            return Promise.resolve();
        }
    }

    test('registerNumberRange', () => {
        BaseSiCard.registerNumberRange(100, 1000, FakeSiCard1);
        BaseSiCard.registerNumberRange(0, 100, FakeSiCard2);
        BaseSiCard.registerNumberRange(1000, 2000, FakeSiCard2);
        expect(BaseSiCard.getTypeByCardNumber(-1)).toEqual(undefined);
        expect(BaseSiCard.getTypeByCardNumber(0)).toEqual(FakeSiCard2);
        expect(BaseSiCard.getTypeByCardNumber(99)).toEqual(FakeSiCard2);
        expect(BaseSiCard.getTypeByCardNumber(100)).toEqual(FakeSiCard1);
        expect(BaseSiCard.getTypeByCardNumber(999)).toEqual(FakeSiCard1);
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(FakeSiCard2);
        expect(BaseSiCard.getTypeByCardNumber(1999)).toEqual(FakeSiCard2);
        expect(BaseSiCard.getTypeByCardNumber(2000)).toEqual(undefined);
    });
    test('fromCardNumber', () => {
        BaseSiCard.registerNumberRange(100, 1000, FakeSiCard1);
        const siCard500 = BaseSiCard.fromCardNumber(500);
        expect(siCard500 instanceof BaseSiCard).toBe(true);
        expect(siCard500 instanceof FakeSiCard1).toBe(true);
        const siCard5000 = BaseSiCard.fromCardNumber(5000);
        expect(siCard5000).toBe(undefined);
    });
    describe('detectFromMessage', () => {
        let triedToGetInstance = false;
        class SiCard1 extends BaseSiCard {
            static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage) {
                triedToGetInstance = true;
                if (message.mode !== undefined) {
                    return undefined;
                }
                return new SiCard1(1);
            }

            typeSpecificRead() {
                return Promise.resolve();
            }
        }

        beforeEach(() => {
            BaseSiCard.registerNumberRange(1000, 10000, SiCard1);
            BaseSiCard.registerNumberRange(10000, 20000, FakeSiCard2);
        });

        test('detects card from valid message', () => {
            expect(triedToGetInstance).toBe(false);
            const siCard500 = BaseSiCard.detectFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: [],
            });
            expect(triedToGetInstance).toBe(true);
            expect(siCard500 instanceof SiCard1).toBe(true);
            expect(siCard500?.cardNumber).toBe(1);
        });

        test('does not detect from NAK message', () => {
            const nakMessage = BaseSiCard.detectFromMessage({
                mode: proto.NAK,
            });
            expect(nakMessage).toBe(undefined);
        });
    });
    test('read', async () => {
        class SiCard1 extends BaseSiCard {
            typeSpecificRead() {
                this.raceResult.startTime = 1;
                return Promise.resolve();
            }
        }
        const siCard500 = new SiCard1(500);
        try {
            await siCard500.confirm();
            expect({canConfirm: true}).toEqual({canConfirm: false});
        } catch (_err: unknown) {
            // ignore
        }
        siCard500.mainStation = {
            sendMessage: (
                _message: siProtocol.SiMessage,
                _numResponses?: number,
            ) => Promise.resolve([]),
        };
        const result = await siCard500.read();
        expect(result).toBe(siCard500);
        expect(siCard500.raceResult.startTime).toBe(1);
        await siCard500.confirm();
    });
    const emptySiCard = new FakeSiCard1(501);
    const nonemptySiCard = new FakeSiCard1(502);
    nonemptySiCard.raceResult = {
        cardNumber: 502,
        clearTime: 1,
        checkTime: 2,
        startTime: 1,
        punches: [
            {code: 31, time: 2},
        ],
        finishTime: 1,
        cardHolder: {firstName: 'John'},
    };
    test('Empty SiCard toDict', async () => {
        expect(emptySiCard.toDict()).toEqual({
            cardNumber: 501,
            clearTime: undefined,
            checkTime: undefined,
            startTime: undefined,
            finishTime: undefined,
            punches: undefined,
            cardHolder: undefined,
        });
    });
    test('Non-empty SiCard toDict', async () => {
        expect(nonemptySiCard.toDict()).toEqual({
            cardNumber: 502,
            clearTime: 1,
            checkTime: 2,
            startTime: 1,
            finishTime: 1,
            punches: [{code: 31, time: 2}],
            cardHolder: {firstName: 'John'},
        });
    });
    test('Empty SiCard toString', async () => {
        expect(emptySiCard.toString()).toEqual(
            'FakeSiCard1\nCard Number: 501\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\n? Punches\nCard Holder:\n?\n',
        );
    });
    test('Non-empty SiCard toString', async () => {
        expect(nonemptySiCard.toString()).toEqual(
            'FakeSiCard1\nCard Number: 502\nClear: 1\nCheck: 2\nStart: 1\nFinish: 1\n31: 2\nCard Holder:\nfirstName: John\n',
        );
    });
    test('Empty SiCard getMonotonizedRaceResult', async () => {
        expect(emptySiCard.getMonotonizedRaceResult()).toEqual({
            cardNumber: 501,
            clearTime: undefined,
            checkTime: undefined,
            startTime: undefined,
            finishTime: undefined,
            punches: undefined,
            cardHolder: undefined,
        });
    });
    test('Non-empty SiCard getMonotonizedRaceResult', async () => {
        expect(nonemptySiCard.getMonotonizedRaceResult()).toEqual({
            cardNumber: 502,
            clearTime: 1,
            checkTime: 2,
            startTime: 43201,
            finishTime: 86401,
            punches: [{code: 31, time: 43202}],
            cardHolder: {firstName: 'John'},
        });
    });
    test('Empty SiCard getNormalizedRaceResult', async () => {
        expect(() => emptySiCard.getNormalizedRaceResult()).toThrow();
    });
    test('Non-empty SiCard getNormalizedRaceResult', async () => {
        expect(nonemptySiCard.getNormalizedRaceResult()).toEqual({
            cardNumber: 502,
            clearTime: -43200,
            checkTime: -43199,
            startTime: 0,
            finishTime: 43200,
            punches: [{code: 31, time: 1}],
            cardHolder: {firstName: 'John'},
        });
    });
});
