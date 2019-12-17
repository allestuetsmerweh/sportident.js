/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard11} from './SiCard11';

describe('SiCard11', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(9000000)).toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(9999999)).toEqual(SiCard11);
    });
    it('is modern', (done) => {
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
