import {GetInfoCommand} from './getInfo';
import {SetInfoCommand} from './setInfo';
import {GetBackupCommand} from './getBackup';
import {TestCommand} from './test';
import {SendCommand} from './send';
import {PipeCommand} from './pipe';
import {SimulateCommand} from './simulate';

export const commands = {
    'getInfo': GetInfoCommand,
    'setInfo': SetInfoCommand,
    'getBackup': GetBackupCommand,
    'test': TestCommand,
    'send': SendCommand,
    'pipe': PipeCommand,
    'simulate': SimulateCommand,
};
