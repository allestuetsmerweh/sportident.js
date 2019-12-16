/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as storage from '../storage';
import * as testUtils from '../testUtils';
import {BaseSiCard} from './BaseSiCard';

beforeEach(() => {
    BaseSiCard.resetNumberRangeRegistry();
});

describe('BaseSiCard', () => {
    class FakeSiCard1 extends BaseSiCard {
        typeSpecificRead() {
            return Promise.resolve();
        }
    }
    class FakeSiCard2 extends BaseSiCard {
        typeSpecificRead() {
            return Promise.resolve();
        }
    }

    it('registerNumberRange', () => {
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
    it('fromCardNumber', () => {
        BaseSiCard.registerNumberRange(100, 1000, FakeSiCard1);
        const siCard500 = BaseSiCard.fromCardNumber(500);
        expect(siCard500 instanceof BaseSiCard).toBe(true);
        expect(siCard500 instanceof FakeSiCard1).toBe(true);
        const siCard5000 = BaseSiCard.fromCardNumber(5000);
        expect(siCard5000).toBe(undefined);
    });
    describe('detectFromMessage', () => {
        let commandChecked = false;
        class SiCard1 extends BaseSiCard {
            static typeSpecificShouldDetectFromMessage(message: siProtocol.SiMessage) {
                commandChecked = true;
                return message.mode === undefined && message.command === proto.cmd.SI5_DET;
            }

            typeSpecificRead() {
                return Promise.resolve();
            }
        }

        const getParametersForCardNumber = (cardNumber: number) => {
            const cardNumberArr = siProtocol.cardNumber2arr(cardNumber) as number[];
            cardNumberArr.reverse();
            return [0x00, 0x00, ...cardNumberArr];
        };

        beforeEach(() => {
            BaseSiCard.registerNumberRange(1000, 10000, SiCard1);
            BaseSiCard.registerNumberRange(10000, 20000, FakeSiCard2);
        });

        it('detects card from valid message', () => {
            expect(commandChecked).toBe(false);
            const siCard500 = BaseSiCard.detectFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: getParametersForCardNumber(5000),
            });
            expect(commandChecked).toBe(true);
            expect(siCard500 instanceof BaseSiCard).toBe(true);
            expect(siCard500 instanceof SiCard1).toBe(true);
        });

        it('does not detect from NAK message', () => {
            const nakMessage = BaseSiCard.detectFromMessage({
                mode: proto.NAK,
            });
            expect(nakMessage).toBe(undefined);
        });

        it('does not detect when there are too few parameters', () => {
            const tooShortParametersResult = BaseSiCard.detectFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: [0x00],
            });
            expect(tooShortParametersResult).toBe(undefined);
        });

        it('does not detect when there is no such registered card type', () => {
            const unregisteredCardNumberResult = BaseSiCard.detectFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: getParametersForCardNumber(20001),
            });
            expect(unregisteredCardNumberResult).toBe(undefined);
        });

        it('does not detect when the card type is misconfigured', () => {
            const misconfiguredCardTypeResult = BaseSiCard.detectFromMessage({
                command: proto.cmd.SI5_DET,
                parameters: getParametersForCardNumber(10001),
            });
            expect(misconfiguredCardTypeResult).toBe(undefined);
        });

        it('does not detect when the command is incorrect', () => {
            const wrongCommandResult = BaseSiCard.detectFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI5_DET]),
                parameters: getParametersForCardNumber(5000),
            });
            expect(wrongCommandResult).toBe(undefined);
        });
    });
    it('read', async (done) => {
        const SiCard1StorageDefinition = storage.defineStorage(0x00, {});
        class SiCard1 extends BaseSiCard {
            static StorageDefinition = SiCard1StorageDefinition;

            typeSpecificRead() {
                this.startTime = 1;
                return Promise.resolve();
            }
        }
        const siCard500 = new SiCard1(500);
        try {
            await siCard500.confirm();
            expect({canConfirm: true}).toEqual({canConfirm: false});
        } catch (err) {
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
        expect(siCard500.startTime).toBe(1);
        await siCard500.confirm();
        done();
    });
    const emptySiCard = new FakeSiCard1(501);
    const nonemptySiCard = new FakeSiCard1(502);
    nonemptySiCard.clearTime = 1;
    nonemptySiCard.checkTime = 2;
    nonemptySiCard.startTime = 3;
    nonemptySiCard.punches = [
        {code: 31, time: 4},
    ];
    nonemptySiCard.finishTime = 5;
    nonemptySiCard.cardHolder = {firstName: 'John'};
    it('Empty SiCard toDict', async () => {
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
    it('Non-empty SiCard toDict', async () => {
        expect(nonemptySiCard.toDict()).toEqual({
            cardNumber: 502,
            clearTime: 1,
            checkTime: 2,
            startTime: 3,
            finishTime: 5,
            punches: [{code: 31, time: 4}],
            cardHolder: {firstName: 'John'},
        });
    });
    it('Empty SiCard toString', async () => {
        expect(emptySiCard.toString()).toEqual(
            'FakeSiCard1 Number: 501\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\nNo punches\nCard Holder:\n?\n',
        );
    });
    it('Non-empty SiCard toString', async () => {
        expect(nonemptySiCard.toString()).toEqual(
            'FakeSiCard1 Number: 502\nClear: 1\nCheck: 2\nStart: 3\nFinish: 5\n31: 4\nCard Holder:\nfirstName: John\n',
        );
    });
});
