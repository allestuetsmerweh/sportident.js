import {GetInfoCommand} from './getInfo';
import {SetInfoCommand} from './setInfo';
import {GetBackupCommand} from './getBackup';
import {TestCommand} from './test';
import {SendCommand} from './send';
import {PipeCommand} from './pipe';
import {SimulateCommand} from './simulate';

export const getSiShellCommands = () => ({
    'getInfo': new GetInfoCommand(),
    'setInfo': new SetInfoCommand(),
    'getBackup': new GetBackupCommand(),
    'test': new TestCommand(),
    'send': new SendCommand(),
    'pipe': new PipeCommand(),
    'simulate': new SimulateCommand(),
});
