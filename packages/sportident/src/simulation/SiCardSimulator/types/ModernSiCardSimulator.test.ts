/* eslint-env jasmine */

import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {ModernSiCardSimulator} from './ModernSiCardSimulator';
import {getEmptyCard} from '../../../SiCard/types/modernSiCardExamples';

testUtils.useFakeTimers();

describe('ModernSiCardSimulator', () => {
    it('exists', () => {
        expect(ModernSiCardSimulator).not.toBe(undefined);
    });
    const testData = getEmptyCard();
    const myModernSiCardSimulator = new ModernSiCardSimulator(
        testData.storageData,
    );
    it('handleDetect works', () => {
        expect(myModernSiCardSimulator.handleDetect()).toEqual({
            command: proto.cmd.SI8_DET,
            parameters: utils.unPrettyHex('00 6B 96 8C'),
        });
    });
    it('handleRequest works', () => {
        expect(() => myModernSiCardSimulator.handleRequest({
            command: proto.cmd.GET_SI5,
            parameters: [0x06],
        })).toThrow();

        expect(myModernSiCardSimulator.handleRequest({
            command: proto.cmd.GET_SI8,
            parameters: [0x06],
        })).toEqual([
            {
                command: proto.cmd.GET_SI8,
                parameters: [
                    6,
                    ...testData.storageData.slice(6 * 128, 7 * 128),
                ],
            },
        ]);

        expect(myModernSiCardSimulator.handleRequest({
            command: proto.cmd.GET_SI8,
            parameters: [0x08],
        })).toEqual([
            {
                command: proto.cmd.GET_SI8,
                parameters: [
                    0,
                    ...testData.storageData.slice(0, 128),
                ],
            },
            {
                command: proto.cmd.GET_SI8,
                parameters: [
                    6,
                    ...testData.storageData.slice(6 * 128, 7 * 128),
                ],
            },
            {
                command: proto.cmd.GET_SI8,
                parameters: [
                    7,
                    ...testData.storageData.slice(7 * 128, 8 * 128),
                ],
            },
        ]);
    });
});
