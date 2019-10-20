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
        expect(shellControl.stringOutput).toEqual('$ getInfo\ntarget is not optional\n$ ');
        expect(shellControl.stringInput).toEqual('');
    });
});
