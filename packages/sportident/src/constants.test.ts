/* eslint-env jasmine */

import * as constants from './constants';

describe('constants', () => {
    describe('proto', () => {
        it('basicCmd', () => {
            expect('basicCmd' in constants.proto).toBe(true);
            expect('basicCmdLookup' in constants.proto).toBe(true);
            expect(constants.proto.basicCmdLookup).not.toBe(undefined);
        });
        it('cmd', () => {
            expect('cmd' in constants.proto).toBe(true);
            expect('cmdLookup' in constants.proto).toBe(true);
            expect(constants.proto.cmdLookup).not.toBe(undefined);
        });
    });
});
