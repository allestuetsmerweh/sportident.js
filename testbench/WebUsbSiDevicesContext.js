import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import si from '../src/index';

export const WebUsbSiDevicesContext = React.createContext(Immutable.List([]));

export const WebUsbSiDevicesProvider = (props) => {
    const WebUsbSiDevice = React.useMemo(() => si.drivers.getWebUsbSiDevice(window.navigator), []);
    const [webUsbSiDevices, setWebUsbSiDevices] = React.useState(Immutable.Map({}));
    React.useEffect(() => {
        const onDeviceAdd = (event) => {
            const device = event.webUsbSiDevice;
            if (!webUsbSiDevices.has(device.ident)) {
                const newWebUsbSiDevices = webUsbSiDevices.set(device.ident, device);
                console.log('add');
                setWebUsbSiDevices(newWebUsbSiDevices);
            }
        };
        const onDeviceRemove = (event) => {
            const device = event.webUsbSiDevice;
            if (webUsbSiDevices.has(device.ident)) {
                const newWebUsbSiDevices = webUsbSiDevices.delete(device.ident);
                console.log('remove');
                setWebUsbSiDevices(newWebUsbSiDevices);
            }
        };
        WebUsbSiDevice.addEventListener('add', onDeviceAdd);
        WebUsbSiDevice.addEventListener('remove', onDeviceRemove);
        WebUsbSiDevice.startAutoDetection().then((devices) => {
            const existingIdentSet = Immutable.Set.fromKeys(webUsbSiDevices);
            const newIdentSet = Immutable.Set(devices.map((device) => device.ident));
            if (!newIdentSet.equals(existingIdentSet)) {
                console.log('reset');
                const newWebUsbSiDevices = Immutable.Map(devices.map((device) => [device.ident, device]));
                setWebUsbSiDevices(newWebUsbSiDevices);
            }
        });
        console.log('setup');
        return () => {
            console.log('cleanup');
            WebUsbSiDevice.stopAutoDetection();
            WebUsbSiDevice.removeEventListener('add', onDeviceAdd);
            WebUsbSiDevice.removeEventListener('remove', onDeviceRemove);
        };
    }, [webUsbSiDevices]);
    console.log('render');
    const providedValue = {
        addNewDevice: () => WebUsbSiDevice.detect(),
        webUsbSiDevices: webUsbSiDevices,
    };
    return (
        <WebUsbSiDevicesContext.Provider value={providedValue}>
            {props.children}
        </WebUsbSiDevicesContext.Provider>
    );
};
WebUsbSiDevicesProvider.propTypes = {
    children: PropTypes.node,
};
