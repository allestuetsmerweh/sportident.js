import {describe, expect, test} from '@jest/globals';
import * as testUtils from 'sportident/lib/testUtils';
import {ShellCommandContext} from './Shell';
import {ShellControl} from './testUtils';

testUtils.useFakeTimers();

const COMMANDS = {
    test: {
        autocomplete: (args: string[]) => args,
        validateArgs: (_context: ShellCommandContext) => true,
        run: (context: ShellCommandContext) => {
            const newNumber = ((context.env.testNumber as number) || 0) + 1;
            context.putString(`t${newNumber}\n`);
            context.env.testNumber = newNumber;
            return Promise.resolve();
        },
        printUsage: (context: ShellCommandContext) => {
            context.putString('usage\n');
        },
    },
};

describe('Shell', () => {
    test('starts', () => {
        const shellControl = new ShellControl(COMMANDS);
        shellControl.run();
        expect(shellControl.stringOutput).toEqual('$ ');
    });
    test('starts with custom prompt', () => {
        const shellControl = new ShellControl(COMMANDS, {prompt: '> '});
        shellControl.run();
        expect(shellControl.stringOutput).toEqual('> ');
    });
    test('can run test command', async () => {
        const shellControl = new ShellControl(COMMANDS);
        shellControl.run();
        shellControl.putString('test\n');
        await testUtils.nTimesAsync(10, () => testUtils.advanceTimersByTime(10));
        expect(shellControl.stringOutput).toEqual('$ test\nt1\n$ ');
        expect(shellControl.stringInput).toEqual('');
    });
    test('can run test command with initial env', async () => {
        const shellControl = new ShellControl(COMMANDS, {initialEnv: {testNumber: 3}});
        shellControl.run();
        shellControl.putString('test\n');
        await testUtils.nTimesAsync(10, () => testUtils.advanceTimersByTime(10));
        expect(shellControl.stringOutput).toEqual('$ test\nt4\n$ ');
        expect(shellControl.stringInput).toEqual('');
    });
    test('can modify env in test command', async () => {
        const shellControl = new ShellControl(COMMANDS);
        shellControl.run();
        shellControl.putString('test\ntest\n');
        await testUtils.nTimesAsync(30, () => testUtils.advanceTimersByTime(10));
        expect(shellControl.stringOutput).toEqual('$ test\nt1\n$ test\nt2\n$ ');
        expect(shellControl.stringInput).toEqual('');
    });
});
