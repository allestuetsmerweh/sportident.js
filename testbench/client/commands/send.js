import si from '../../../src';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class SendCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'command',
                regex: /^[0-9a-fA-F]{2}$/,
            },
            {
                name: 'parameters',
                regex: /^[0-9a-fA-F]+$/,
            },
            {
                name: 'number of responses',
                regex: /^[0-9]+$/,
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. send direct F9 01 0');
        this.printUsageDetail('e.g. send remote F9 01 1');
    }

    execute() {
        const {parameters: terminalParameters, logLine, device} = this.context;
        const station = getDirectOrRemoteStation(terminalParameters[0], device);
        if (station === undefined) {
            logLine('No such station');
            return Promise.resolve();
        }
        const commandStr = terminalParameters[1].replace(/\s/g, '');
        if (commandStr.length !== 2) {
            logLine(`Command must be one byte, is: ${commandStr}`);
            return Promise.resolve();
        }
        const command = parseInt(commandStr, 16);
        const parametersStr = terminalParameters[2].replace(/\s/g, '');
        if (parametersStr.length % 2 !== 0) {
            logLine(`Parameters must be bytes, is: ${parametersStr}`);
            return Promise.resolve();
        }
        const parameters = [];
        for (let i = 0; i < parametersStr.length; i += 2) {
            parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
        }
        const numResp = terminalParameters.length > 3 ? parseInt(terminalParameters[3], 10) : 0;
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
    }
}
