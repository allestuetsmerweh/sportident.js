import * as utils from 'sportident/lib/utils';
import {ShellCommandContext} from '../Shell';
import {BaseCommand, ArgType} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class SendCommand extends BaseCommand {
    getArgTypes(): ArgType[] {
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

    printUsage(context: ShellCommandContext): void {
        super.printUsage(context);
        context.putString('e.g. send direct F9 01 0\n');
        context.putString('e.g. send remote F9 01 1\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const station = getDirectOrRemoteStation(context.args[1], context.env.device);
        if (station === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }
        const commandStr = context.args[2].replace(/\s/g, '');
        if (commandStr.length !== 2) {
            context.putString(`Command must be one byte, is: ${commandStr}\n`);
            return Promise.resolve();
        }
        const command = parseInt(commandStr, 16);
        const parametersStr = context.args[3].replace(/\s/g, '');
        if (parametersStr.length % 2 !== 0) {
            context.putString(`Parameters must be bytes, is: ${parametersStr}\n`);
            return Promise.resolve();
        }
        const parameters = [];
        for (let i = 0; i < parametersStr.length; i += 2) {
            parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
        }
        const numResp = context.args.length > 4 ? parseInt(context.args[4], 10) : 0;
        return station.sendMessage({
            command: command,
            parameters: parameters,
        }, numResp)
            .then((allResponses: number[][]) => {
                allResponses.forEach((response: number[], index: number) => {
                    context.putString(`Answer[${index}]:\n`);
                    const lines = utils.prettyHex(response, 16).split('\n');
                    lines.forEach((line: string) => {
                        context.putString(` ${line}\n`);
                    });
                });
            });
    }
}
