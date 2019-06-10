import si from '../../src';

const tests = {
    'card': ({logLine, device}) => {
        const mainStation = si.MainStation.fromSiDevice(device);
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
        const simulateStation = (mode, code, actionName) => () => mainStation.code(code)
            .then(() => mainStation.mode(mode))
            .then(() => mainStation.autoSend(1))
            .then(() => {
                logLine(`${actionName} card...`);
                return new Promise((resolve) => {
                    resetCardCallbacks(mainStation);
                    mainStation.addEventListener('cardRemoved', (cardEvent) => {
                        const card = cardEvent.card;
                        if (fixedSiNumber === null) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber === card.cardNumber) {
                            resetCardCallbacks(mainStation);
                            logLine(`${actionName} ${card.constructor.name} succeeded: ${card.cardNumber}`);
                            if (mode === si.Station.Mode.Clear) {
                                cardState = '';
                            } else {
                                cardState += `${cardState === '' ? '' : '-'}${actionName}`;
                            }
                            setTimeout(resolve, 1);
                        } else {
                            logLine(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})`);
                        }
                    });
                });
            });
        const readoutCard = () => () => mainStation.autoSend(0)
            .then(() => mainStation.mode(si.Station.Mode.Readout))
            .then(() => mainStation.code(10))
            .then(() => {
                logLine('Read card...');
                return new Promise((resolve) => {
                    resetCardCallbacks(mainStation);
                    mainStation.addEventListener('card', (cardEvent) => {
                        const card = cardEvent.card;
                        if (fixedSiNumber === null) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber === card.cardNumber) {
                            logLine(`${card.constructor.name} read: ${card.cardNumber}`);
                            samples[cardState] = card.toDict();
                            logLine(cardState);
                            card.toString().split('\n').forEach((line) => {
                                logLine(line);
                            });
                            mainStation.addEventListener('cardRemoved', (removeEvent) => {
                                const removedCard = removeEvent.card;
                                if (fixedSiNumber === removedCard.cardNumber) {
                                    resetCardCallbacks(mainStation);
                                    setTimeout(resolve, 1);
                                }
                            });
                        } else {
                            logLine(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})`);
                        }
                    });
                });
            });
        return simulateStation(si.Station.Mode.Clear, 1, 'Clear')()
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Check, 2, 'Check'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Start, 3, 'Start'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 31, 'Punch 31'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 32, 'Punch 32'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 33, 'Punch 33'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 34, 'Punch 34'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 35, 'Punch 35'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 36, 'Punch 36'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 37, 'Punch 37'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 38, 'Punch 38'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 39, 'Punch 39'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 40, 'Punch 40'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 41, 'Punch 41'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 42, 'Punch 42'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 43, 'Punch 43'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 44, 'Punch 44'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 45, 'Punch 45'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 46, 'Punch 46'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 47, 'Punch 47'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 48, 'Punch 48'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 49, 'Punch 49'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 50, 'Punch 50'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 51, 'Punch 51'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 52, 'Punch 52'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 53, 'Punch 53'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 54, 'Punch 54'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 55, 'Punch 55'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 56, 'Punch 56'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 57, 'Punch 57'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 58, 'Punch 58'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 59, 'Punch 59'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 60, 'Punch 60'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 61, 'Punch 61'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 62, 'Punch 62'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 63, 'Punch 63'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 64, 'Punch 64'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 65, 'Punch 65'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 66, 'Punch 66'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 67, 'Punch 67'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 68, 'Punch 68'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 69, 'Punch 69'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Control, 70, 'Punch 70'))
            .then(readoutCard())
            .then(simulateStation(si.Station.Mode.Clear, 4, 'Clear'))
            .then(readoutCard('clear'))
            .then(simulateStation(si.Station.Mode.Control, 31, 'Punch 31'))
            .then(readoutCard('clear-31'))
            .then(readoutCard('clear-[31-70]'))
            .then(() => {
                logLine('Finished!');
                console.log('SAMPLES', samples);
            });
    },
};

export const testCommand = (context) => {
    const {userLine, logLine} = context;
    const res = /test ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: test [what]');
        return Promise.resolve();
    }
    const what = res[1];
    if (!(what in tests)) {
        logLine(`No such test: ${what}`);
        logLine(`Available tests: ${Object.keys(tests)}`);
        return Promise.resolve();
    }
    return tests[what](context);
};
