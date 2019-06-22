import si from '../../../src';

export const setInfoCommand = ({userLine, logLine, device}) => {
    const res = /setInfo ([^\s]+) ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: setInfo [infoName] [newValue]');
        logLine('       e.g. setInfo code 10');
        return Promise.resolve();
    }
    const infoName = res[1];
    const newValue = res[2];
    const mainStation = si.MainStation.fromSiDevice(device);
    return mainStation.atomically(() => {
        mainStation.setInfo(infoName, newValue);
    })
        .then(() => mainStation.readInfo())
        .then(() => {
            const infoValue = mainStation.getInfo(infoName);
            logLine(`${infoName}: ${infoValue}`);
        });
};
