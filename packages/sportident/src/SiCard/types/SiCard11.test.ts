import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard11} from './SiCard11';

describe('SiCard11', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(8999999)).not.toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(9000000)).toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(9999999)).toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(10000000)).not.toEqual(SiCard11);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = SiCard11.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, /* TODO: */0x00, 0x98, 0x76, 0x54],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SiCard11).toBe(true);
            expect(instance.cardNumber).toBe(9991764);
        });
        test('returns undefined when message has mode', () => {
            expect(SiCard11.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(SiCard11.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI8_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(SiCard11.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when the card number does not match', () => {
            expect(SiCard11.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, /* TODO: */0x00, 0x22, 0x22, 0x22],
            })).toBe(undefined);
        });
    });
    test('is modern', (done) => {
        const mySiCard11 = new SiCard11(8500000);
        mySiCard11.mainStation = {
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
        mySiCard11.typeSpecificRead()
            .then(() => {
                expect(mySiCard11.raceResult.cardNumber).toBe(0);
                expect(mySiCard11.raceResult.startTime).toBe(0);
                expect(mySiCard11.raceResult.finishTime).toBe(0);
                expect(mySiCard11.raceResult.punches).toEqual([]);
                expect(mySiCard11.punchCount).toBe(0);
                done();
            });
    });
});
