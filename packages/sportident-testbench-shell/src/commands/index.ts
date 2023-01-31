import {GetHolderCommand} from './getHolder';
import {GetInfoCommand} from './getInfo';
import {SetInfoCommand} from './setInfo';
import {GetBackupCommand} from './getBackup';
import {TestCommand} from './test';
import {SendCommand} from './send';
import {PipeCommand} from './pipe';
import {SimulateCommand} from './simulate';

type SiShellCommands = {
    'getHolder': GetHolderCommand,
    'getInfo': GetInfoCommand,
    'setInfo': SetInfoCommand,
    'getBackup': GetBackupCommand,
    'test': TestCommand,
    'send': SendCommand,
    'pipe': PipeCommand,
    'simulate': SimulateCommand,
};

export const getSiShellCommands = (): SiShellCommands => ({
    'getHolder': new GetHolderCommand(),
    'getInfo': new GetInfoCommand(),
    'setInfo': new SetInfoCommand(),
    'getBackup': new GetBackupCommand(),
    'test': new TestCommand(),
    'send': new SendCommand(),
    'pipe': new PipeCommand(),
    'simulate': new SimulateCommand(),
});
