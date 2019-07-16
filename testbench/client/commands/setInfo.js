import si from '../../../src';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export const setInfoCommand = ({userLine, logLine, device}) => {
    const res = /setInfo ([^\s]+) ([^\s]+) ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: setInfo [d(irect)/r(emote)] [infoName] [newValue]');
        logLine('       e.g. setInfo direct code 10');
        logLine('       e.g. setInfo remote mode Readout');
        logLine('       e.g. setInfo d beeps false');
        return Promise.resolve();
    }
    const station = getDirectOrRemoteStation(res[1], device);
    if (station === undefined) {
        logLine('No such station');
        return Promise.resolve();
    }
    const infoName = res[2];
    const newValue = res[3];
    const field = station.getField(infoName);
    const fieldValue = si.storage.SiFieldValue.fromString(field, newValue);
    return station.atomically(() => {
        station.setInfo(infoName, fieldValue);
    })
        .then(() => station.readInfo())
        .then(() => {
            const infoValue = station.getInfo(infoName);
            logLine(`${infoName}: ${infoValue}`);
        });
};
