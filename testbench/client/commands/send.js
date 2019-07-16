import si from '../../../src';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export const sendCommand = ({userLine, logLine, device}) => {
    const res = /send ([^\s]*)\s+([0-9a-fA-F\s]+)\s*:\s*([0-9a-fA-F\s]+)\s*:\s*([0-9]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: send [d(irect)/r(emote)] [command]: [parameters]: [numResp]');
        logLine('       e.g. send direct F9: 01: 0');
        logLine('       e.g. send r F9: 01: 1');
        return Promise.resolve();
    }
    const station = getDirectOrRemoteStation(res[1], device);
    if (station === undefined) {
        logLine('No such station');
        return Promise.resolve();
    }
    const commandStr = res[2].replace(/\s/g, '');
    if (commandStr.length !== 2) {
        logLine(`Command must be one byte, is: ${commandStr}`);
        return Promise.resolve();
    }
    const command = parseInt(commandStr, 16);
    const parametersStr = res[3].replace(/\s/g, '');
    if (parametersStr.length % 2 !== 0) {
        logLine(`Parameters must be bytes, is: ${parametersStr}`);
        return Promise.resolve();
    }
    const parameters = [];
    for (let i = 0; i < parametersStr.length; i += 2) {
        parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
    }
    const numResp = res.length > 4 ? parseInt(res[4], 10) : 0;
    return station.sendMessage({
        command: command,
        parameters: parameters,
    }, numResp)
        .then((allResponses) => {
            allResponses.forEach((response, index) => {
                logLine(`Answer[${index}]:`);
                si.utils.prettyHex(response, 16).split('\n').forEach((line) => {
                    logLine(` ${line}`);
                });
            });
        });
};
