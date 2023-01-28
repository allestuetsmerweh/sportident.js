import {describe, expect, test} from '@jest/globals';
import * as constants from './constants';

describe('constants', () => {
    describe('proto', () => {
        test('basicCmd', () => {
            expect('basicCmd' in constants.proto).toBe(true);
            expect('basicCmdLookup' in constants.proto).toBe(true);
            expect(constants.proto.basicCmdLookup).not.toBe(undefined);
        });
        test('cmd', () => {
            expect('cmd' in constants.proto).toBe(true);
            expect('cmdLookup' in constants.proto).toBe(true);
            expect(constants.proto.cmdLookup).not.toBe(undefined);
        });
    });
});
