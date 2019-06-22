import si from '../../../src';
import {SiExternalApplication} from '../SiExternalApplication';

export const pipeCommand = ({userLine, logLine, device, userInput}) => {
    const res = /pipe ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: pipe [URL]');
        logLine('       e.g. pipe /tmp/vwin_com1');
        return Promise.resolve();
    }
    const url = res[1];
    return new Promise((resolve, _reject) => {
        const externalApplication = new SiExternalApplication(url);

        let deviceToApplicationBuffer = [];
        let applicationToDeviceBuffer = [];

        const onDeviceReceive = (e) => {
            const uint8Data = e.uint8Data;
            deviceToApplicationBuffer.push(...uint8Data);
            const {messages, remainder} = si.protocol.parseAll(deviceToApplicationBuffer);
            messages.forEach((message) => {
                console.log('SiDevice:', si.protocol.prettyMessage(message));
            });
            deviceToApplicationBuffer = remainder;
            externalApplication.send(uint8Data);
        };
        device.addEventListener('receive', onDeviceReceive);
        const onApplicationReceive = (e) => {
            const uint8Data = e.uint8Data;
            applicationToDeviceBuffer.push(...uint8Data);
            const {messages, remainder} = si.protocol.parseAll(applicationToDeviceBuffer);
            messages.forEach((message) => {
                console.log('SiExternalApplication:', si.protocol.prettyMessage(message));
            });
            applicationToDeviceBuffer = remainder;
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
