import si from '../../src/index';
import {SiSimulator} from '../SiSimulator';

export const pipeCommand = (context) => {
    const usage = si.utils.timeoutResolvePromise('Usage: pipe [URL]<br />e.g. pipe unix:///tmp/vwin_com1');
    const res = /pipe ([^\s]+)/.exec(context.userLine);
    if (res === null) {
        return usage;
    }
    const url = res[1];
    return new Promise((resolve, _reject) => {
        const mainStation = context.mainStation;
        const siSimulator = new SiSimulator(url);
        mainStation.onMessage = (message) => {
            console.log('MainStation:', message);
            console.warn(si.utils.prettyMessage(message));
            siSimulator.sendMessage(message);
        };
        siSimulator.onMessage = (message) => {
            console.log('SiSimulator:', message);
            console.warn(si.utils.prettyMessage(message));
            mainStation.sendMessage(message);
        };

        context.userInput.keyup((event) => {
            if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                mainStation.onMessage = false;
                siSimulator.close();
                resolve('Piping finished.');
            }
        });
    });
};
