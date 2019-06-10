import si from '../../src';
import {SiExternalApplication} from '../SiExternalApplication';

export const pipeCommand = ({userLine, logLine, device, userInput}) => {
    const res = /pipe ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: pipe [URL]');
        logLine('       e.g. pipe unix:///tmp/vwin_com1');
        return Promise.resolve();
    }
    const url = res[1];
    return new Promise((resolve, _reject) => {
        const externalApplication = new SiExternalApplication(url);
        const onDeviceReceive = (e) => {
            const uint8Data = e.uint8Data;
            console.log('SiDevice:', si.utils.prettyHex(uint8Data));
            externalApplication.send(uint8Data);
        };
        device.addEventListener('receive', onDeviceReceive);
        const onApplicationReceive = (e) => {
            const uint8Data = e.uint8Data;
            console.log('SiExternalApplication:', si.utils.prettyHex(uint8Data));
            device.send(uint8Data);
        };
        externalApplication.addEventListener('receive', onApplicationReceive);

        userInput.addEventListener('keyup', (event) => {
            if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                device.removeEventListener('receive', onDeviceReceive);
                externalApplication.removeEventListener('receive', onApplicationReceive);
                externalApplication.close();
                resolve('Piping finished.');
            }
        });
    });
};
