/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {SiCard6Simulator} from './SiCard6Simulator';
import {getCardWith16Punches} from '../../../SiCard/types/siCard6Examples';

testUtils.useFakeTimers();

describe('SiCard6Simulator', () => {
    it('exists', () => {
        expect(SiCard6Simulator).not.toBe(undefined);
    });
    const testData = getCardWith16Punches();
    const mySiCard6Simulator = new SiCard6Simulator(
        testData.storageData,
    );
    it('handleDetect works', () => {
        expect(mySiCard6Simulator.handleDetect()).toEqual({
            command: proto.cmd.SI6_DET,
            parameters: utils.unPrettyHex('00 07 A1 3D'),
        });
    });
    it('handleRequest works', () => {
        expect(() => mySiCard6Simulator.handleRequest({
            command: proto.cmd.GET_SI5,
            parameters: [0x06],
        })).toThrow();

        expect(mySiCard6Simulator.handleRequest({
            command: proto.cmd.GET_SI6,
            parameters: [0x06],
        })).toEqual([
            {
                command: proto.cmd.GET_SI6,
                parameters: [
                    6,
                    ...testData.storageData.slice(6 * 128, 7 * 128),
                ],
            },
        ]);

        expect(mySiCard6Simulator.handleRequest({
            command: proto.cmd.GET_SI6,
            parameters: [0x08],
        })).toEqual([
            {
                command: proto.cmd.GET_SI6,
                parameters: [
                    0,
                    ...testData.storageData.slice(0, 128),
                ],
            },
            {
                command: proto.cmd.GET_SI6,
                parameters: [
                    6,
                    ...testData.storageData.slice(6 * 128, 7 * 128),
                ],
            },
            {
                command: proto.cmd.GET_SI6,
                parameters: [
                    7,
                    ...testData.storageData.slice(7 * 128, 8 * 128),
                ],
            },
        ]);
    });
});
