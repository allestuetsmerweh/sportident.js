import React from 'react';
import ReactDOM from 'react-dom';
import indexHtml from './index.html';
import stylesCss from './styles.css';
import {WebUsbSiDevicesContext, WebUsbSiDevicesProvider} from './WebUsbSiDevicesContext';
import {MainStationList} from './MainStationList';
import {Terminal} from './Terminal';

export default () => indexHtml.replace(
    '<!--INSERT_CSS_HERE-->',
    `<style>${stylesCss.toString()}</style>`,
);

const Testbench = () => {
    const getIdentFromWindowHash = (windowHash) => {
        const res = /^#?(\S+)$/.exec(windowHash);
        return res[1];
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
                devices={webUsbSiDevices.valueSeq()}
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

if (window.addEventListener) {
    window.addEventListener('load', () => {
        ReactDOM.render(
            (
                <WebUsbSiDevicesProvider>
                    <Testbench />
                </WebUsbSiDevicesProvider>
            ),
            window.document.getElementById('root'),
        );
    });
}
