/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {SiCard5Simulator} from './SiCard5Simulator';
import {getCardWith16Punches} from '../../../SiCard/types/siCard5Examples';

testUtils.useFakeTimers();

describe('SiCard5Simulator', () => {
    it('exists', () => {
        expect(SiCard5Simulator).not.toBe(undefined);
    });
    const testData = getCardWith16Punches();
    const mySiCard5Simulator = new SiCard5Simulator(
        testData.storageData,
    );
    it('handleDetect works', () => {
        expect(mySiCard5Simulator.handleDetect()).toEqual({
            command: proto.cmd.SI5_DET,
            parameters: utils.unPrettyHex('00 04 19 02'),
        });
    });
    it('handleRequest works', () => {
        expect(() => mySiCard5Simulator.handleRequest({
            command: proto.cmd.GET_SI8,
            parameters: [0x06],
        })).toThrow();

        expect(mySiCard5Simulator.handleRequest({
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
