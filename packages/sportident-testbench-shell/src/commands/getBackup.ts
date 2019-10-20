import * as utils from 'sportident/lib/utils';
import {proto} from 'sportident/lib/constants';
import {ShellCommandContext} from '../Shell';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class GetBackupCommand extends BaseCommand {
    getArgTypes() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
        ];
    }

    printUsage(context: ShellCommandContext) {
        super.printUsage(context);
        context.putString('e.g. getBackup direct\n');
        context.putString('e.g. getBackup remote\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const station = getDirectOrRemoteStation(context.args[1], context.env.device);
        if (station === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }
        const readBlock = (blockIndex: number) => (
            station.sendMessage({
                command: proto.cmd.GET_BACKUP,
                parameters: [0x00, Math.floor(blockIndex / 2) + 1, (blockIndex % 2) * 0x80, 0x80],
            }, 1)
        );
        const allBlocks: number[][] = [];
        const readAllBlocks = (blockIndex: number) => {
            if (blockIndex > 26) {
                console.warn(allBlocks.length);
                console.warn(allBlocks.map((block) => utils.prettyHex(block, 16)).join('\n\n'));
                return Promise.resolve();
            }
            return readBlock(blockIndex)
                .then((results: number[][]) => {
                    console.warn(results[0][3] === Math.floor(blockIndex / 2) + 1);
                    console.warn(results[0][4] === (blockIndex % 2) * 0x80);
                    allBlocks.push(results[0].slice(5));
                    return readAllBlocks(blockIndex + 1);
                });
        };
        return readAllBlocks(0);
    }
}
