/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {FakeSiCard5} from './FakeSiCard5';
import {getCardWith16Punches} from '../../../SiCard/types/siCard5Examples';

testUtils.useFakeTimers();

describe('FakeSiCard5', () => {
    it('exists', () => {
        expect(FakeSiCard5).not.toBe(undefined);
    });
    const testData = getCardWith16Punches();
    const myFakeSiCard5 = new FakeSiCard5(
        testData.storageData,
    );
    it('handleDetect works', () => {
        expect(myFakeSiCard5.handleDetect()).toEqual({
            command: proto.cmd.SI5_DET,
            parameters: utils.unPrettyHex('00 04 19 02'),
        });
    });
    it('handleRequest works', () => {
        expect(() => myFakeSiCard5.handleRequest({
            command: proto.cmd.GET_SI8,
            parameters: [0x06],
        })).toThrow();

        expect(myFakeSiCard5.handleRequest({
            command: proto.cmd.GET_SI5,
            parameters: [],
        })).toEqual([
            {
                command: proto.cmd.GET_SI5,
                parameters: testData.storageData,
            },
        ]);
    });
});
