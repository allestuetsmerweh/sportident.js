import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import indexHtml from './index.html';
import stylesCss from './styles.css';
import {MainStationList} from './MainStationList';
import {Terminal} from './Terminal';
import {WebUsbSiDevicesContext} from './WebUsbSiDevicesContext';
import si from '../../src';

export default () => indexHtml.replace(
    '<!--INSERT_CSS_HERE-->',
    `<style>${stylesCss.toString()}</style>`,
);

const Testbench = () => {
    const getIdentFromWindowHash = (windowHash) => {
        const res = /^#?(\S+)$/.exec(windowHash);
        return res && res[1];
    };
    const [windowHash, setWindowHash] = React.useState(window.location.hash);
    const {webUsbSiDevices, addNewDevice} = React.useContext(WebUsbSiDevicesContext);
    const selectedDevice = webUsbSiDevices.get(getIdentFromWindowHash(windowHash));
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

const WebUsbSiDeviceProvider = (props) => {
    const WebUsbSiDevice = React.useMemo(() => si.drivers.getWebUsbSiDevice(window.navigator), []);
    const webUsbSiDevices = si.react.useSiDevices(WebUsbSiDevice);
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
WebUsbSiDeviceProvider.propTypes = {
    children: PropTypes.node,
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
