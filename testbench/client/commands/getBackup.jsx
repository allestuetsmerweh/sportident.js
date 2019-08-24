import si from '../../../src';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class GetBackupCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. getBackup direct');
        this.printUsageDetail('e.g. getBackup remote');
    }

    execute() {
        const {parameters, logLine, device} = this.context;
        const station = getDirectOrRemoteStation(parameters[0], device);
        if (station === undefined) {
            logLine('No such station');
            return Promise.resolve();
        }
        const readBlock = (blockIndex) => (
            station.sendMessage({
                command: si.constants.proto.cmd.GET_BACKUP,
                parameters: [0x00, Math.floor(blockIndex / 2) + 1, (blockIndex % 2) * 0x80, 0x80],
            }, 1)
        );
        const allBlocks = [];
        const readAllBlocks = (blockIndex) => {
            if (blockIndex > 26) {
                console.warn(allBlocks.length);
                console.warn(allBlocks.map((block) => si.utils.prettyHex(block, 16)).join('\n\n'));
                return Promise.resolve();
            }
            return readBlock(blockIndex)
                .then((results) => {
                    console.warn(results[0][3] === Math.floor(blockIndex / 2) + 1);
                    console.warn(results[0][4] === (blockIndex % 2) * 0x80);
                    allBlocks.push(results[0].slice(5));
                    return readAllBlocks(blockIndex + 1);
                });
        };
        return readAllBlocks(0);
    }
}
