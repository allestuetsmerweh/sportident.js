import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {ModernSiCardSeries} from './ModernSiCard';
import {SiCard10} from './SiCard10';

describe('SiCard10', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(6999999)).not.toEqual(SiCard10);
        expect(BaseSiCard.getTypeByCardNumber(7000000)).toEqual(SiCard10);
        expect(BaseSiCard.getTypeByCardNumber(7999999)).toEqual(SiCard10);
        expect(BaseSiCard.getTypeByCardNumber(8000000)).not.toEqual(SiCard10);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = SiCard10.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, ModernSiCardSeries.SiCard10, 0x77, 0x77, 0x77],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SiCard10).toBe(true);
            expect(instance.cardNumber).toBe(7829367);
        });
        test('returns undefined when message has mode', () => {
            expect(SiCard10.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(SiCard10.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI8_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(SiCard10.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when the series does not match', () => {
            expect(SiCard10.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, testUtils.getRandomByteExcept([ModernSiCardSeries.SiCard10]), 0x22, 0x22, 0x22],
            })).toBe(undefined);
        });
    });
    test('is modern', (done) => {
        const mySiCard10 = new SiCard10(8500000);
        mySiCard10.mainStation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                if (message.mode !== undefined) {
                    return Promise.reject(new Error('message mode is not undefined'));
                }
                const {command, parameters} = message;
                expect(command).toBe(proto.cmd.GET_SI8);
                expect(numResponses).toBe(1);
                const pageNumberToGet = parameters[0];
                const getPage = (pageNumber: number) => [
                    ...[0x00, 0x00, pageNumber],
                    ..._.range(128).map(() => 0),
                ];
                return Promise.resolve([getPage(pageNumberToGet)]);
            },
        };
        mySiCard10.typeSpecificRead()
            .then(() => {
                expect(mySiCard10.raceResult.cardNumber).toBe(0);
                expect(mySiCard10.raceResult.startTime).toBe(0);
                expect(mySiCard10.raceResult.finishTime).toBe(0);
                expect(mySiCard10.raceResult.punches).toEqual([]);
                expect(mySiCard10.punchCount).toBe(0);
                done();
            });
    });
});
