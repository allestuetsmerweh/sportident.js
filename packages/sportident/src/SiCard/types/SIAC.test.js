/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';
import {SIAC} from './SIAC';

describe('SIAC', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(8000000)).toEqual(SIAC);
        expect(BaseSiCard.getTypeByCardNumber(8999999)).toEqual(SIAC);
    });
    it('is modern', (done) => {
        const mySIAC = new SIAC(8500000);
        mySIAC.mainStation = {
            sendMessage: ({command, parameters}, numResponses) => {
                expect(command).toBe(proto.cmd.GET_SI8);
                expect(numResponses).toBe(1);
                const pageNumberToGet = parameters[0];
                const getPage = (pageNumber) => [
                    ...[0x00, 0x00, pageNumber],
                    ..._.range(128).map(() => 0),
                ];
                return Promise.resolve([getPage(pageNumberToGet)]);
            },
        };
        mySIAC.typeSpecificRead()
            .then(() => {
                expect(mySIAC.cardNumber).toBe(0);
                expect(mySIAC.startTime).toBe(0);
                expect(mySIAC.finishTime).toBe(0);
                expect(mySIAC.punchCount).toBe(0);
                expect(mySIAC.punches).toEqual([]);
                done();
            });
    });
});
