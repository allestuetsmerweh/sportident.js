/* eslint-env jasmine */

import * as testUtils from 'sportident/lib/testUtils';
import {getSiShellCommands} from './index';
import {ShellControl} from './testUtils';

testUtils.useFakeTimers();

const COMMANDS = getSiShellCommands();
const OPTIONS = {initialEnv: {device: {}}};

describe('SiShell', () => {
    it('can run getInfo command', async () => {
        const shellControl = new ShellControl(COMMANDS, OPTIONS);
        shellControl.run();
        shellControl.putString('getInfo\n');
        await testUtils.nTimesAsync(100, () => testUtils.advanceTimersByTime(10));
        const expectedString = (
            '$ getInfo\n' +
            'target is not optional\n' +
            'Usage: getInfo [target] [information name]?\n' +
            'target: direct, remote\n' +
            'information name: code, mode, beeps, flashes, autoSend, extendedProtocol, serialNumber, firmwareVersion, buildDate, deviceModel, memorySize, batteryDate, batteryCapacity, batteryState, backupPointer, siCard6Mode, memoryOverflow, lastWriteDate, autoOffTimeout, refreshRate, powerMode, interval, wtf, program, handshake, sprint4ms, passwordOnly, stopOnFullBackup, autoReadout, sleepDay, sleepSeconds, workingMinutes\n' +
            'e.g. getInfo direct\n' +
            'e.g. getInfo direct code\n' +
            'e.g. getInfo remote mode\n' +
            '$ '
        );
        expect(shellControl.stringOutput).toEqual(expectedString);
        expect(shellControl.stringInput).toEqual('');
    });
});
