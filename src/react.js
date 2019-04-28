import React from 'react';
import Immutable from 'immutable';

export const useSiDevices = (siDeviceClass) => {
    const [siDevices, setSiDevices] = React.useState(Immutable.Map({}));
    React.useEffect(() => {
        const onDeviceAdd = (event) => {
            const device = event.webUsbSiDevice;
            if (!siDevices.has(device.ident)) {
                const newSiDevices = siDevices.set(device.ident, device);
                console.log('add');
                setSiDevices(newSiDevices);
            }
        };
        const onDeviceRemove = (event) => {
            const device = event.webUsbSiDevice;
            if (siDevices.has(device.ident)) {
                const newSiDevices = siDevices.delete(device.ident);
                console.log('remove');
                setSiDevices(newSiDevices);
            }
        };
        siDeviceClass.addEventListener('add', onDeviceAdd);
        siDeviceClass.addEventListener('remove', onDeviceRemove);
        siDeviceClass.startAutoDetection().then((devices) => {
            const existingIdentSet = Immutable.Set.fromKeys(siDevices);
            const newIdentSet = Immutable.Set(devices.map((device) => device.ident));
            if (!newIdentSet.equals(existingIdentSet)) {
                console.log('reset');
                const newSiDevices = Immutable.Map(devices.map((device) => [device.ident, device]));
                setSiDevices(newSiDevices);
            }
        });
        console.log('setup');
        return () => {
            console.log('cleanup');
            siDeviceClass.stopAutoDetection();
            siDeviceClass.removeEventListener('add', onDeviceAdd);
            siDeviceClass.removeEventListener('remove', onDeviceRemove);
        };
    }, [siDevices]);
    return siDevices;
};
