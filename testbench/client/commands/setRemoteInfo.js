import si from '../../../src';

export const setRemoteInfoCommand = ({userLine, logLine, device}) => {
    const res = /setRemoteInfo ([^\s]+) ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: setRemoteInfo [infoName] [newValue]');
        logLine('       e.g. setRemoteInfo code 10');
        return Promise.resolve();
    }
    const infoName = res[1];
    const newValue = res[2];
    const coupledStation = si.CoupledStation.fromSiDevice(device);
    return coupledStation.atomically(() => {
        coupledStation.setInfo(infoName, newValue);
    })
        .then(() => coupledStation.readInfo())
        .then(() => {
            const infoValue = coupledStation.getInfo(infoName);
            logLine(`${infoName}: ${infoValue}`);
        });
};
