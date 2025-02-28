import React from 'react';
import ReactDOM from 'react-dom/client';
import {getWebUsbSiDeviceDriver} from 'sportident-webusb/lib';
import * as nav from 'sportident-webusb/lib/INavigatorWebUsb';
import {SiMainStation} from 'sportident/lib/SiStation';

import './styles.css';


const ExampleApp = () => {
    const webUsbSiDeviceDriver = React.useMemo(
        () => getWebUsbSiDeviceDriver(window.navigator.usb as unknown as nav.WebUsb),
        [],
    );
    const [cardContent, setCardContent] = React.useState(['No card']);
    type CleanUpObject = {cleanUp: () => Promise<void>}|undefined;
    const [cleanUp, setCleanUp] = React.useState<CleanUpObject>(undefined);
    const readCards = React.useCallback(() => {
        webUsbSiDeviceDriver.detect().then((d) => {
            const station = SiMainStation.fromSiDevice(d);
            station.readCards((card) => {
                setCardContent(['Reading...']);
                card.read().then(() => {
                    const lines = card.toString().split('\n');
                    setCardContent(lines);
                    card.confirm();
                });
            })
                .then((cleanUpFunction) => {
                    setCleanUp({
                        cleanUp: () => cleanUpFunction().then(() => {
                            setCleanUp(undefined);
                        }),
                    });
                });
            station.addEventListener('siCardRemoved', () => {
                setCardContent(['No card']);
            });
        });
    }, []);
    return (
        <div>
            <button onClick={cleanUp ? cleanUp.cleanUp : readCards}>{cleanUp ? 'Stop Reading Cards' : 'Read Cards'}</button>
            <div>{cardContent.map((line, index) => <div key={index}>{line}</div>)}</div>
        </div>
    );
};

if (window.addEventListener) {
    window.addEventListener('load', () => {
        const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
        root.render(
            <ExampleApp />
        );
    });
}
