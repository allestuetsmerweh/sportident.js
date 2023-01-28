import {describe, expect, test} from '@jest/globals';
import {proto} from '../../../constants';
import * as utils from '../../../utils';
import * as testUtils from '../../../testUtils';
import {FakeSiCard6} from './FakeSiCard6';
import {getCardWith16Punches} from '../../../SiCard/types/siCard6Examples';

testUtils.useFakeTimers();

describe('FakeSiCard6', () => {
    test('exists', () => {
        expect(FakeSiCard6).not.toBe(undefined);
    });
    const testData = getCardWith16Punches();
    const myFakeSiCard6 = new FakeSiCard6(
        testData.storageData,
    );
    test('handleDetect works', () => {
        expect(myFakeSiCard6.handleDetect()).toEqual({
            command: proto.cmd.SI6_DET,
            parameters: utils.unPrettyHex('00 07 A1 3D'),
        });
    });
    test('handleRequest works', () => {
        expect(() => myFakeSiCard6.handleRequest({
            command: proto.cmd.GET_SI5,
            parameters: [0x06],
        })).toThrow();

        expect(myFakeSiCard6.handleRequest({
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

        expect(myFakeSiCard6.handleRequest({
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
