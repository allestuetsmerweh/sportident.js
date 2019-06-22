/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {SiCard5Simulator} from './SiCard5Simulator';
import {SiCard5} from '../../../SiCard/types/SiCard5';

testUtils.useFakeTimers();

describe('SiCard5Simulator', () => {
    it('exists', () => {
        expect(SiCard5Simulator).not.toBe(undefined);
    });
    it('handleDetect works', () => {
        const mySiCard6 = new SiCard5Simulator(SiCard5.getTestData()[0].storageData);
        expect(mySiCard6.handleDetect()).toEqual({
            command: proto.cmd.SI5_DET,
            parameters: utils.unPrettyHex('00 04 19 02'),
        });
    });
    it('handleRequest works', () => {
        const testData = SiCard5.getTestData()[0];
        const myModernSiCardSimulator = new SiCard5Simulator(
            testData.storageData,
        );

        expect(myModernSiCardSimulator.handleRequest({
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
