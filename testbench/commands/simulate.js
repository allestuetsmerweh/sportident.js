import si from '../../src/index';
import {SiSimulator} from '../SiSimulator';
import {SiMainStationSimulator} from '../SiMainStationSimulator';

export const simulateCommand = (context) => {
    const usage = si.utils.timeoutResolvePromise('Usage: simulate [what] [URL]<br />e.g. simulate BSM8 unix:///tmp/vwin_com1');
    const res = /simulate ([^\s]+) ([^\s]+)/.exec(context.userLine);
    if (res === null) {
        return usage;
    }
    const what = res[1];
    const mainStationStorages = {
        'BSM8': si.utils.unPrettyHex(
            '00 02 C1 A1 F7 36 35 36 0E 06 0B 91 98 80 20 C0' +
            '4B 08 4E FA 28 0E 06 0B 00 36 EE 80 00 00 18 04' +
            'FF 09 00 00 00 00 00 00 00 00 00 00 4D 70 FF FF' +
            'FF 00 87 C1 00 00 00 2D 00 00 00 00 FF 00 FB E5' +
            '00 24 FC 18 FF FF 19 99 0A 3D 7F F8 85 0C 05 01' +
            '00 00 6F F0 FF FF FF FF 00 00 00 4B FF FF FF FF' +
            '30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF' +
            '28 05 0A 31 05 13 01 02 01 87 EE 00 0E 12 00 3C',
        ),
    };
    const cardSimulations = {
        'SI5': {
            type: si.Card.Type.SICard5,
            storage: si.utils.unPrettyHex(
                'aa 29 00 01 19 02 04 00 00 00 00 00 00 00 00 00' +
                '65 19 02 1d db 1e 2f 03 56 ee ee 28 04 1f 00 07' +
                '00 1f 1e 02 20 1e 13 00 ee ee 00 ee ee 00 ee ee' +
                '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
                '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
                '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
                '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee' +
                '00 00 ee ee 00 ee ee 00 ee ee 00 ee ee 00 ee ee',
            ),
        },
    };
    const mainStationStorage = mainStationStorages[what];
    if (!mainStationStorage) {
        const availableDataIdentifiers = Object.keys(mainStationStorages).join(', ');
        return si.utils.timeoutResolvePromise(
            `No such SiMainStation data: ${what}\nAvailable data: ${availableDataIdentifiers}`,
        );
    }

    const url = res[2];
    return new Promise((resolve, _reject) => {
        const siSimulator = new SiSimulator(url);
        const siMainStationSimulator = new SiMainStationSimulator(mainStationStorage);
        siSimulator.onMessage = (message) => {
            console.log('SiSimulator:', message);
            siMainStationSimulator.sendMessage(message);
        };
        siMainStationSimulator.onMessage = (message) => {
            console.log('SiMainStationSimulator:', message);
            siSimulator.sendMessage(message);
        };

        const onCtrlC = () => {
            siSimulator.close();
            resolve('Simulation finished.');
        };

        const onSubCommand = (e) => {
            const userSubLine = context.userInput.text();
            context.logLine(`> ${userSubLine}`);
            context.userInput.html('');
            e.preventDefault();
            const subResIn = /in ([^\s]+)/.exec(userSubLine);
            const subResOut = /out/.exec(userSubLine);
            if (subResIn) {
                const simulationName = subResIn[1];
                if (!(simulationName in cardSimulations)) {
                    return;
                }
                const simulation = cardSimulations[simulationName];
                context.logLine('Insert Card');
                siMainStationSimulator.insertCard(simulation.type, simulation.storage);
            }
            if (subResOut) {
                context.logLine(`out ${subResOut}`);
            }
        };

        context.userInput.keyup((e) => {
            if (e.keyCode === 67 && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
                onCtrlC();
            } else if (e.keyCode === 13) {
                onSubCommand(e);
            }
        });
    });
};
