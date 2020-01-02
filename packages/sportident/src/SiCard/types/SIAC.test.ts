/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {SIAC} from './SIAC';

describe('SIAC', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(7999999)).not.toEqual(SIAC);
        expect(BaseSiCard.getTypeByCardNumber(8000000)).toEqual(SIAC);
        expect(BaseSiCard.getTypeByCardNumber(8999999)).toEqual(SIAC);
        expect(BaseSiCard.getTypeByCardNumber(9000000)).not.toEqual(SIAC);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        it('works for valid message', () => {
            const instance = SIAC.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, /* TODO: */0x00, 0x88, 0x88, 0x88],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SIAC).toBe(true);
            expect(instance.cardNumber).toBe(8947848);
        });
        it('returns undefined when message has mode', () => {
            expect(SIAC.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        it('returns undefined when message has wrong command', () => {
            expect(SIAC.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI8_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        it('returns undefined when there are too few parameters', () => {
            expect(SIAC.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [],
            })).toBe(undefined);
        });
        it('returns undefined when the card number does not match', () => {
            expect(SIAC.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, /* TODO: */0x00, 0x22, 0x22, 0x22],
            })).toBe(undefined);
        });
    });
    it('is modern', (done) => {
        const mySIAC = new SIAC(8500000);
        mySIAC.mainStation = {
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
        mySIAC.typeSpecificRead()
            .then(() => {
                expect(mySIAC.raceResult.cardNumber).toBe(0);
                expect(mySIAC.raceResult.startTime).toBe(0);
                expect(mySIAC.raceResult.finishTime).toBe(0);
                expect(mySIAC.raceResult.punches).toEqual([]);
                expect(mySIAC.punchCount).toBe(0);
                done();
            });
    });
});
