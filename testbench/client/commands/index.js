import {getInfoCommand} from './getInfo';
import {setInfoCommand} from './setInfo';
import {testCommand} from './test';
import {sendCommand} from './send';
import {pipeCommand} from './pipe';
import {simulateCommand} from './simulate';

export const commands = {
    'getInfo': getInfoCommand,
    'setInfo': setInfoCommand,
    'test': testCommand,
    'send': sendCommand,
    'pipe': pipeCommand,
    'simulate': simulateCommand,
};
