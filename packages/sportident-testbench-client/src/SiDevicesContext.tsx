import React from 'react';
import * as Immutable from 'immutable';
import {ISiDevice, ISiDeviceDriverData} from 'sportident/lib/SiDevice/ISiDevice';

export type SiDevicesContextPayload = {
    addNewDevice: () => Promise<ISiDevice<ISiDeviceDriverData<unknown>>>,
    webUsbSiDevices: Immutable.Map<string, ISiDevice<ISiDeviceDriverData<unknown>>>,
};

export const SiDevicesContext = React.createContext<SiDevicesContextPayload>({
    addNewDevice: () => Promise.reject(new Error()),
    webUsbSiDevices: Immutable.Map({}),
});
