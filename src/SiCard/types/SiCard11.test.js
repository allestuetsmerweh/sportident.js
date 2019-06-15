/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../../constants';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard11} from './SiCard11';

describe('SiCard11', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(9000000)).toEqual(SiCard11);
        expect(BaseSiCard.getTypeByCardNumber(9999999)).toEqual(SiCard11);
    });
    it('is modern', (done) => {
        const mySIAC = new SiCard11(8500000);
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
