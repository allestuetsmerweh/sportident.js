import si from '../../../src';

export const getDirectOrRemoteStation = (userChoice, device) => {
    const isRemoteByInput = {
        remote: true,
        direct: false,
    };
    const isRemote = isRemoteByInput[userChoice];
    let station = undefined;
    if (isRemote === true) {
        station = si.CoupledSiStation.fromSiDevice(device);
    } else if (isRemote === false) {
        station = si.SiMainStation.fromSiDevice(device);
    }
    return station;
};
