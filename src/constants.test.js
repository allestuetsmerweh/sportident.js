/* eslint-env jasmine */

import * as constants from './constants';

describe('constants', () => {
    describe('proto', () => {
        it('basicCmd', () => {
            expect('basicCmd' in constants.proto).toBe(true);
            expect('basicCmdLookup' in constants.proto).toBe(true);
            const basicCmdLookup = constants.proto.basicCmdLookup;
            Object.keys(constants.proto.basicCmd)
                .filter((basicCmdName) => basicCmdName !== '_lookup')
                .forEach((basicCmdName) => {
                    expect(basicCmdName).toMatch(/^[A-Z0-9_]+$/);
                    const basicCmdCode = constants.proto.basicCmd[basicCmdName];
                    expect(basicCmdCode & 0xFF).toBe(basicCmdCode);
                    expect(basicCmdLookup[basicCmdCode]).toBe(basicCmdName);
                });
        });
        it('cmd', () => {
            expect('cmd' in constants.proto).toBe(true);
            expect('cmdLookup' in constants.proto).toBe(true);
            const cmdLookup = constants.proto.cmdLookup;
            Object.keys(constants.proto.cmd)
                .filter((basicCmdName) => basicCmdName !== '_lookup')
                .forEach((cmdName) => {
                    expect(cmdName).toMatch(/^[A-Z0-9_]+$/);
                    const cmdCode = constants.proto.cmd[cmdName];
                    expect(cmdCode & 0xFF).toBe(cmdCode);
                    expect(cmdLookup[cmdCode]).toBe(cmdName);
                });
        });
        it('sysDataOffset', () => {
            expect('sysDataOffset' in constants.proto).toBe(true);
        });
    });
});
