/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as utils from '../utils';
import * as testUtils from '../testUtils';
import {BaseSiCard} from './BaseSiCard';

beforeEach(() => {
    BaseSiCard.resetNumberRangeRegistry();
});

describe('BaseSiCard', () => {
    it('registerNumberRange', () => {
        class SiCard1 extends BaseSiCard {}
        class SiCard2 extends BaseSiCard {}
        BaseSiCard.registerNumberRange(100, 1000, SiCard1);
        BaseSiCard.registerNumberRange(0, 100, SiCard2);
        BaseSiCard.registerNumberRange(1000, 2000, SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(-1)).toEqual(undefined);
        expect(BaseSiCard.getTypeByCardNumber(0)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(99)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(100)).toEqual(SiCard1);
        expect(BaseSiCard.getTypeByCardNumber(999)).toEqual(SiCard1);
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(1999)).toEqual(SiCard2);
        expect(BaseSiCard.getTypeByCardNumber(2000)).toEqual(undefined);
    });
    it('fromCardNumber', () => {
        class SiCard1 extends BaseSiCard {}
        BaseSiCard.registerNumberRange(100, 1000, SiCard1);
        const siCard500 = BaseSiCard.fromCardNumber(500);
        expect(siCard500 instanceof BaseSiCard).toBe(true);
        expect(siCard500 instanceof SiCard1).toBe(true);
        const siCard5000 = BaseSiCard.fromCardNumber(5000);
        expect(siCard5000).toBe(undefined);
    });
    it('detectFromMessage', () => {
        let commandChecked = false;
        class SiCard1 extends BaseSiCard {
            static typeSpecificShouldDetectFromMessage(message) {
                commandChecked = true;
                return message.command === proto.cmd.SI5_DET;
            }
        }
        BaseSiCard.registerNumberRange(1000, 10000, SiCard1);
        class SiCard2 extends BaseSiCard {}
        BaseSiCard.registerNumberRange(10000, 20000, SiCard2);

        const getParametersForCardNumber = (cardNumber) => {
            const cardNumberArr = siProtocol.cardNumber2arr(cardNumber);
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
        const baseSiCard500 = new BaseSiCard(500);
        expect(() => baseSiCard500.read()).toThrow();

        class SiCard1 extends BaseSiCard {
            typeSpecificRead() {
                this.punchCount = 1;
                this.punches = [{code: 31, time: 3}];
                return Promise.resolve(this);
            }
        }
        SiCard1.StorageDefinition = utils.defineStorage(0x00, {});
        const siCard500 = new SiCard1(500);
        siCard500.mainStation = {
            sendMessage: () => Promise.resolve(),
        };
        const result = await siCard500.read();
        expect(result).toBe(siCard500);
        expect(siCard500.punchCount).toBe(1);
        expect(siCard500.toDict()).toEqual({
            cardNumber: 500,
            clearTime: -1,
            checkTime: -1,
            startTime: -1,
            finishTime: -1,
            punches: [{code: 31, time: 3}],
        });
        expect(siCard500.toString()).toEqual(
            'SiCard1 Number: 500\nClear: -1\nCheck: -1\nStart: -1\nFinish: -1\n31: 3\n',
        );
        await siCard500.confirm();
        done();
    });
});
