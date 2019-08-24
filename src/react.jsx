import React from 'react';
import Immutable from 'immutable';

export const useSiDevices = (siDeviceClass, useReact = React) => {
    const [siDevices, setSiDevices] = useReact.useState(Immutable.Map({}));
    useReact.useEffect(() => {
        const onDeviceAdd = (event) => {
            const device = event.siDevice;
            setSiDevices((currentSiDevices) => {
                if (!currentSiDevices.has(device.ident)) {
                    console.log('useSiDevices: add');
                    return currentSiDevices.set(device.ident, device);
                }
                return currentSiDevices;
            });
        };
        const onDeviceRemove = (event) => {
            const device = event.siDevice;
            setSiDevices((currentSiDevices) => {
                if (currentSiDevices.has(device.ident)) {
                    console.log('useSiDevices: remove');
                    return currentSiDevices.delete(device.ident);
                }
                return currentSiDevices;
            });
        };
        siDeviceClass.addEventListener('add', onDeviceAdd);
        siDeviceClass.addEventListener('remove', onDeviceRemove);
        siDeviceClass.startAutoDetection().then((devices) => {
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
            siDeviceClass.stopAutoDetection();
            siDeviceClass.removeEventListener('add', onDeviceAdd);
            siDeviceClass.removeEventListener('remove', onDeviceRemove);
        };
    }, []);
    return siDevices;
};
