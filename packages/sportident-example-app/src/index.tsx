import React from 'react';
import ReactDOM from 'react-dom';
// @ts-ignore
import indexHtml from './index.html';
// @ts-ignore
import stylesCss from './styles.css';
import {getWebUsbSiDeviceDriver} from 'sportident-webusb/lib';
import {SiMainStation} from 'sportident/lib/SiStation';

export default () => indexHtml.replace(
    '<!--INSERT_CSS_HERE-->',
    `<style>${stylesCss.toString()}</style>`,
);

const ExampleApp = () => {
    const webUsbSiDeviceDriver = React.useMemo(
        () => getWebUsbSiDeviceDriver((window.navigator as any).usb),
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
        ReactDOM.render(
            (
                <ExampleApp />
            ),
            window.document.getElementById('root'),
        );
    });
}
