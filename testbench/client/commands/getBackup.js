import si from '../../../src';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export const getBackupCommand = ({userLine, logLine, device}) => {
    const res = /getBackup ([^\s]*)/.exec(userLine);
    if (res === null) {
        logLine('Usage: getBackup [d(irect)/r(emote)]');
        logLine('       e.g. getBackup direct');
        logLine('       e.g. getBackup r');
        return Promise.resolve();
    }
    const station = getDirectOrRemoteStation(res[1], device);
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
};
