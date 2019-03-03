import {testCommand} from './test';
import {sendCommand} from './send';
import {pipeCommand} from './pipe';
import {simulateCommand} from './simulate';

export const commands = {
    'test': testCommand,
    'send': sendCommand,
    'pipe': pipeCommand,
    'simulate': simulateCommand,
};
