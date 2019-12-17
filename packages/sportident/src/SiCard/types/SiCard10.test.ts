/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard10} from './SiCard10';

describe('SiCard10', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(7000000)).toEqual(SiCard10);
        expect(BaseSiCard.getTypeByCardNumber(7999999)).toEqual(SiCard10);
    });
    it('is modern', (done) => {
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
