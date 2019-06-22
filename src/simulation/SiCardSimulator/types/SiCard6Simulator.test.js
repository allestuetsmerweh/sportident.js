/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {SiCard6Simulator} from './SiCard6Simulator';
import {SiCard6} from '../../../SiCard/types/SiCard6';

testUtils.useFakeTimers();

describe('SiCard6Simulator', () => {
    it('exists', () => {
        expect(SiCard6Simulator).not.toBe(undefined);
    });
    it('handleDetect works', () => {
        const mySiCard6 = new SiCard6Simulator(SiCard6.getTestData()[0].storageData);
        expect(mySiCard6.handleDetect()).toEqual({
            command: proto.cmd.SI6_DET,
            parameters: utils.unPrettyHex('00 07 A1 3D'),
        });
    });
    it('handleRequest works', () => {
        const testData = SiCard6.getTestData()[0];
        const myModernSiCardSimulator = new SiCard6Simulator(
            testData.storageData,
        );

        expect(myModernSiCardSimulator.handleRequest({
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

        expect(myModernSiCardSimulator.handleRequest({
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
