import React from 'react';
import * as Immutable from 'immutable';
import {SiDeviceAddEvent, ISiDeviceDriverWithAutodetection, SiDeviceRemoveEvent} from 'sportident/lib/SiDevice/ISiDeviceDriver';
import {ISiDevice, ISiDeviceDriverData} from 'sportident/lib/SiDevice/ISiDevice';

export const useSiDevices = <T extends ISiDeviceDriverData<unknown>>(
    siDeviceDriver: ISiDeviceDriverWithAutodetection<T>,
): Immutable.Map<string, ISiDevice<T>> => {
    const [siDevices, setSiDevices] = React.useState<Immutable.Map<string, ISiDevice<T>>>(Immutable.Map({}));
    React.useEffect(() => {
        const onDeviceAdd = (event: SiDeviceAddEvent<T>) => {
            const device = event.siDevice;
            setSiDevices((currentSiDevices) => {
                if (!currentSiDevices.has(device.ident)) {
                    console.log('useSiDevices: add');
                    return currentSiDevices.set(device.ident, device);
                }
                return currentSiDevices;
            });
        };
        const onDeviceRemove = (event: SiDeviceRemoveEvent<T>) => {
            const device = event.siDevice;
            setSiDevices((currentSiDevices) => {
                if (currentSiDevices.has(device.ident)) {
                    console.log('useSiDevices: remove');
                    return currentSiDevices.delete(device.ident);
                }
                return currentSiDevices;
            });
        };
        siDeviceDriver.addEventListener('add', onDeviceAdd);
        siDeviceDriver.addEventListener('remove', onDeviceRemove);
        siDeviceDriver.startAutoDetection().then((devices) => {
            setSiDevices((currentSiDevices) => {
                const existingIdentSet = Immutable.Set.fromKeys(currentSiDevices);
                const newIdentSet = Immutable.Set(devices.map((device) => device.ident));
                if (!newIdentSet.equals(existingIdentSet)) {
                    console.log('useSiDevices: reset');
                    return Immutable.Map(devices.map((device) => [device.ident, device]));
                }
                return currentSiDevices;
            });
        });
        console.log('useSiDevices: setup');
        return () => {
            console.log('useSiDevices: cleanup');
            siDeviceDriver.stopAutoDetection();
            siDeviceDriver.removeEventListener('add', onDeviceAdd);
            siDeviceDriver.removeEventListener('remove', onDeviceRemove);
        };
    }, []);
    return siDevices as Immutable.Map<string, ISiDevice<T>>;
};
