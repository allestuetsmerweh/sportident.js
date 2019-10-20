import si from 'sportident/src';
import {BaseCommand} from './BaseCommand';

const tests = {
    'card': ({logLine, device}) => {
        const mainStation = si.SiMainStation.fromSiDevice(device);
        let fixedSiNumber = null;
        const samples = {};
        const _wait = (seconds) => () => new Promise((resolve) => {
            logLine('Please wait...');
            setTimeout(resolve, seconds * 1000);
        });
        let cardState = '';
        const resetCardCallbacks = (mainStation_) => {
            mainStation_._eventListeners = {};
        };
        const simulateStation = (mode, code, actionName) => () => mainStation.atomically(() => {
            mainStation.setInfo('code', code);
            mainStation.setInfo('mode', mode);
            mainStation.setInfo('autoSend', true);
        })
            .then(() => {
                logLine(`Insert card to ${actionName}...`);
                return new Promise((resolve) => {
                    resetCardCallbacks(mainStation);
                    mainStation.addEventListener('siCardObserved', (cardEvent) => {
                        const card = cardEvent.siCard;
                        if (fixedSiNumber === null) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber !== card.cardNumber) {
                            logLine(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})`);
                            return;
                        }
                        resetCardCallbacks(mainStation);
                        logLine(`${actionName} ${card.constructor.name} succeeded: ${card.cardNumber}`);
                        if (mode === si.BaseSiStation.Mode.Clear) {
                            cardState = '';
                        } else {
                            cardState += `${cardState === '' ? '' : '-'}${actionName}`;
                        }
                        setTimeout(resolve, 1);
                    });
                });
            });
        const readoutCard = () => () => mainStation.atomically(() => {
            mainStation.setInfo('autoSend', false);
            mainStation.setInfo('mode', si.BaseSiStation.Mode.Readout);
            mainStation.setInfo('code', 10);
        })
            .then(() => {
                logLine('Insert card to read...');
                return new Promise((resolve) => {
                    resetCardCallbacks(mainStation);
                    const handleCardRemoved = (removeEvent) => {
                        const removedCard = removeEvent.siCard;
                        if (fixedSiNumber === removedCard.cardNumber) {
                            resetCardCallbacks(mainStation);
                            setTimeout(resolve, 1);
                        }
                    };
                    const handleCardRead = (card) => {
                        logLine(`${card.constructor.name} ${card.cardNumber} read.`);
                        samples[cardState] = card.toDict();
                        logLine(cardState);
                        card.toString().split('\n').forEach((line) => {
                            logLine(line);
                        });
                        card.confirm();
                        logLine('Remove card...');
                        mainStation.addEventListener('siCardRemoved', handleCardRemoved);
                    };
                    const handleCardInserted = (cardEvent) => {
                        const card = cardEvent.siCard;
                        if (fixedSiNumber === null) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber !== card.cardNumber) {
                            logLine(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})`);
                            return;
                        }
                        logLine(`Reading ${card.constructor.name} ${card.cardNumber}...`);
                        card.read()
                            .then(handleCardRead);
                    };
                    mainStation.addEventListener('siCardInserted', handleCardInserted);
                });
            });
        return simulateStation(si.BaseSiStation.Mode.Clear, 1, 'Clear')()
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Check, 2, 'Check'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Start, 3, 'Start'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 31, 'Punch 31'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 32, 'Punch 32'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 33, 'Punch 33'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 34, 'Punch 34'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 35, 'Punch 35'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 36, 'Punch 36'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 37, 'Punch 37'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 38, 'Punch 38'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 39, 'Punch 39'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 40, 'Punch 40'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 41, 'Punch 41'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 42, 'Punch 42'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 43, 'Punch 43'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 44, 'Punch 44'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 45, 'Punch 45'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 46, 'Punch 46'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 47, 'Punch 47'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 48, 'Punch 48'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 49, 'Punch 49'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 50, 'Punch 50'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 51, 'Punch 51'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 52, 'Punch 52'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 53, 'Punch 53'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 54, 'Punch 54'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 55, 'Punch 55'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 56, 'Punch 56'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 57, 'Punch 57'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 58, 'Punch 58'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 59, 'Punch 59'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 60, 'Punch 60'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 61, 'Punch 61'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 62, 'Punch 62'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 63, 'Punch 63'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 64, 'Punch 64'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 65, 'Punch 65'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 66, 'Punch 66'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 67, 'Punch 67'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 68, 'Punch 68'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 69, 'Punch 69'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Control, 70, 'Punch 70'))
            .then(readoutCard())
            .then(simulateStation(si.BaseSiStation.Mode.Clear, 4, 'Clear'))
            .then(readoutCard('clear'))
            .then(simulateStation(si.BaseSiStation.Mode.Control, 31, 'Punch 31'))
            .then(readoutCard('clear-31'))
            .then(readoutCard('clear-[31-70]'))
            .then(() => {
                logLine('Finished!');
                console.log('SAMPLES', samples);
            });
    },
};

export class TestCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'test name',
                choices: Object.keys(tests),
            },
        ];
    }

    execute() {
        const {parameters} = this.context;
        const what = parameters[0];
        return tests[what](this.context);
    }
}
