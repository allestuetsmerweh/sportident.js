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
    it('detectFromMessage', () => {
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
        BaseSiCard.registerNumberRange(1000, 10000, SiCard1);
        BaseSiCard.registerNumberRange(10000, 20000, FakeSiCard2);

        const getParametersForCardNumber = (cardNumber: number) => {
            const cardNumberArr = siProtocol.cardNumber2arr(cardNumber) as number[];
            cardNumberArr.reverse();
            return [0x00, 0x00, ...cardNumberArr];
        };

        expect(commandChecked).toBe(false);
        const siCard500 = BaseSiCard.detectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: getParametersForCardNumber(5000),
        });
        expect(commandChecked).toBe(true);
        expect(siCard500 instanceof BaseSiCard).toBe(true);
        expect(siCard500 instanceof SiCard1).toBe(true);

        const tooShortParametersResult = BaseSiCard.detectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: [0x00],
        });
        expect(tooShortParametersResult).toBe(undefined);

        const unregisteredCardNumberResult = BaseSiCard.detectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: getParametersForCardNumber(20001),
        });
        expect(unregisteredCardNumberResult).toBe(undefined);

        const misconfiguredCardTypeResult = BaseSiCard.detectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: getParametersForCardNumber(10001),
        });
        expect(misconfiguredCardTypeResult).toBe(undefined);

        const wrongCommandResult = BaseSiCard.detectFromMessage({
            command: testUtils.getRandomByteExcept([proto.cmd.SI5_DET]),
            parameters: getParametersForCardNumber(5000),
        });
        expect(wrongCommandResult).toBe(undefined);
    });
    it('instance', async (done) => {
        const SiCard1StorageDefinition = storage.defineStorage(0x00, {});
        class SiCard1 extends BaseSiCard {
            static StorageDefinition = SiCard1StorageDefinition;

            typeSpecificRead() {
                this.punchCount = 1;
                this.punches = [{code: 31, time: 3}];
                this.cardHolder = {firstName: 'John'};
                return Promise.resolve();
            }
        }
        const siCard500 = new SiCard1(500);
        siCard500.mainStation = {
            sendMessage: (
                _message: siProtocol.SiMessage,
                _numResponses?: number,
            ) => Promise.resolve([]),
        };
        const result = await siCard500.read();
        expect(result).toBe(siCard500);
        expect(siCard500.punchCount).toBe(1);
        expect(siCard500.toDict()).toEqual({
            cardNumber: 500,
            clearTime: undefined,
            checkTime: undefined,
            startTime: undefined,
            finishTime: undefined,
            punches: [{code: 31, time: 3}],
            cardHolder: {firstName: 'John'},
        });
        expect(siCard500.toString()).toEqual(
            'SiCard1 Number: 500\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\n31: 3\nCard Holder:\nfirstName: John\n',
        );
        await siCard500.confirm();
        done();
    });
});
