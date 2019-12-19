import React from 'react';
import Immutable from 'immutable';
// eslint-disable-next-line no-unused-vars
import {ISiDevice} from 'sportident/lib/SiDevice/ISiDevice';

export type SiDevicesContextPayload = {
    addNewDevice: () => Promise<ISiDevice<any>>,
    webUsbSiDevices: Immutable.Map<string, ISiDevice<any>>,
};

export const SiDevicesContext = React.createContext<SiDevicesContextPayload>({
    addNewDevice: () => Promise.reject(new Error()),
    webUsbSiDevices: Immutable.Map({}),
});
