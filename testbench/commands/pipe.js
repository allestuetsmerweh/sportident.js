import si from '../../src';
import {SiSimulator} from '../SiSimulator';

export const pipeCommand = ({userLine, logLine, mainStation, userInput}) => {
    const res = /pipe ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: pipe [URL]');
        logLine('       e.g. pipe unix:///tmp/vwin_com1');
        return Promise.resolve();
    }
    const url = res[1];
    return new Promise((resolve, _reject) => {
        const siSimulator = new SiSimulator(url);
        mainStation.onMessage = (message) => {
            console.log('MainStation:', message);
            console.warn(si.protocol.prettyMessage(message));
            siSimulator.sendMessage(message);
        };
        siSimulator.onMessage = (message) => {
            console.log('SiSimulator:', message);
            console.warn(si.protocol.prettyMessage(message));
            mainStation.sendMessage(message);
        };

        userInput.addEventListener('keyup', (event) => {
            if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                mainStation.onMessage = false;
                siSimulator.close();
                resolve('Piping finished.');
            }
        });
    });
};
