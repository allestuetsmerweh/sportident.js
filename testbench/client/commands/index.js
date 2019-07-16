import {getInfoCommand} from './getInfo';
import {setInfoCommand} from './setInfo';
import {getBackupCommand} from './getBackup';
import {testCommand} from './test';
import {sendCommand} from './send';
import {pipeCommand} from './pipe';
import {simulateCommand} from './simulate';

export const commands = {
    'getInfo': getInfoCommand,
    'setInfo': setInfoCommand,
    'getBackup': getBackupCommand,
    'test': testCommand,
    'send': sendCommand,
    'pipe': pipeCommand,
    'simulate': simulateCommand,
};
