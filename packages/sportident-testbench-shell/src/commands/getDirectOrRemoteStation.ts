import {SiDevice} from 'sportident/lib/SiDevice';
import {CoupledSiStation, SiMainStation} from 'sportident/lib/SiStation';

export const getDirectOrRemoteStation = (userChoice: string, device: SiDevice<any>) => {
    const isRemoteByInput: {[ident: string]: boolean} = {
        remote: true,
        direct: false,
    };
    const isRemote = isRemoteByInput[userChoice];
    let station = undefined;
    if (isRemote === true) {
        station = CoupledSiStation.fromSiDevice(device);
    } else if (isRemote === false) {
        station = SiMainStation.fromSiDevice(device);
    }
    return station;
};
