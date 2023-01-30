import React from 'react';
import ReactDOM from 'react-dom';
import {MainStationList} from './MainStationList';
import {Terminal} from './Terminal';
import {SiDevicesContext, SiDevicesContextPayload} from './SiDevicesContext';
import {useSiDevices} from 'sportident-react/lib';
import {getWebUsbSiDeviceDriver} from 'sportident-webusb/lib';
import * as nav from 'sportident-webusb/lib/INavigatorWebUsb';

import './styles.css';

const Testbench = () => {
    const getIdentFromWindowHash = (windowHash: string) => {
        const res = /^#?(\S+)$/.exec(windowHash);
        return res && res[1];
    };
    const [windowHash, setWindowHash] = React.useState(window.location.hash);
    const {webUsbSiDevices, addNewDevice} = React.useContext(SiDevicesContext);
    const ident = getIdentFromWindowHash(windowHash);
    const selectedDevice = ident ? webUsbSiDevices.get(ident) : undefined;
    React.useEffect(() => {
        const onHashChange = () => {
            setWindowHash(window.location.hash);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, []);
    return (
        <>
            <MainStationList
                devices={[...webUsbSiDevices.values()]}
                selectedDevice={selectedDevice}
                addNewDevice={addNewDevice}
            />
            <Terminal
                selectedDevice={selectedDevice}
                key={selectedDevice && selectedDevice.ident}
            />
        </>
    );
};

const WebUsbSiDeviceProvider = (
    props: {
        children: React.ReactElement,
    },
) => {
    const webUsbSiDeviceDriver = React.useMemo(
        () => getWebUsbSiDeviceDriver(window.navigator.usb as unknown as nav.WebUsb),
        [],
    );
    const webUsbSiDevices = useSiDevices(webUsbSiDeviceDriver);
    const providedValue = {
        addNewDevice: () => webUsbSiDeviceDriver.detect(),
        webUsbSiDevices: webUsbSiDevices,
    } as unknown as SiDevicesContextPayload;
    return (
        <SiDevicesContext.Provider value={providedValue}>
            {props.children}
        </SiDevicesContext.Provider>
    );
};

if (window.addEventListener) {
    window.addEventListener('load', () => {
        ReactDOM.render(
            (
                <WebUsbSiDeviceProvider>
                    <Testbench />
                </WebUsbSiDeviceProvider>
            ),
            window.document.getElementById('root'),
        );
    });
}
