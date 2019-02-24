import $ from 'jquery';
import si from '../src/index';
import {SiSimulator} from './SiSimulator';
import {SiMainStationSimulator} from './SiMainStationSimulator';

$().ready(() => {
    si.onLoad = () => {
        si.MainStation.drivers = {WebUsb: si.drivers.WebUsb};
        const getSelectedMainStation = () =>
            si.MainStation.all().find((ms) => window.location.hash === `#${ms.device.ident}`);

        const clearLog = () => {
            $('#mainstation-detail-log').html('');
        };

        const log = (text) => {
            const logElem = $('#mainstation-detail-log');
            logElem.append(text);
            logElem.scrollTop(logElem.get(0).scrollHeight);
        };

        const logLine = (text) => {
            log(`${text}<br />`);
        };

        const tests = {
            'card': () => {
                const mainStation = getSelectedMainStation();
                let fixedSiNumber = null;
                const samples = {};
                const _wait = (seconds) => () => new Promise((resolve) => {
                    logLine('Please wait...');
                    setTimeout(resolve, seconds * 1000);
                });
                let cardState = '';
                const simulateStation = (mode, code, actionName) => () => mainStation.code(code)
                    .then(() => mainStation.mode(mode))
                    .then(() => mainStation.autoSend(1))
                    .then(() => {
                        logLine(`${actionName} card...`);
                        return new Promise((resolve) => {
                            mainStation.resetCardCallbacks();
                            mainStation.onCardRemoved = (card) => {
                                if (fixedSiNumber === null) {
                                    fixedSiNumber = card.cardNumber;
                                }
                                if (fixedSiNumber === card.cardNumber) {
                                    mainStation.resetCardCallbacks();
                                    logLine(`${actionName} ${card.type()} succeeded: ${card.cardNumber}`);
                                    if (mode === si.Station.Mode.Clear) {
                                        cardState = '';
                                    } else {
                                        cardState += `${cardState === '' ? '' : '-'}${actionName}`;
                                    }
                                    setTimeout(resolve, 1);
                                } else {
                                    logLine(`Other ${card.type()}: ${card.cardNumber}`);
                                }
                            };
                        });
                    });
                const readoutCard = () => () => mainStation.autoSend(0)
                    .then(() => mainStation.mode(si.Station.Mode.Readout))
                    .then(() => mainStation.code(10))
                    .then(() => {
                        logLine('Read card...');
                        return new Promise((resolve) => {
                            mainStation.resetCardCallbacks();
                            mainStation.onCard = (card) => {
                                if (fixedSiNumber === null) {
                                    fixedSiNumber = card.cardNumber;
                                }
                                if (fixedSiNumber === card.cardNumber) {
                                    logLine(`${card.type()} read: ${card.cardNumber}`);
                                    samples[cardState] = card.toDict();
                                    logLine(cardState);
                                    logLine(card.toHtml());
                                    mainStation.onCardRemoved = (removedCard) => {
                                        if (fixedSiNumber === removedCard.cardNumber) {
                                            mainStation.resetCardCallbacks();
                                            setTimeout(resolve, 1);
                                        }
                                    };
                                } else {
                                    logLine(`Other ${card.type()}: ${card.cardNumber}`);
                                }
                            };
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

        const commands = {
            'test': (userLine) => {
                const usage = si.utils.timeoutResolvePromise('Usage: test [what]');
                const res = /test ([^\s]+)/.exec(userLine);
                if (res === null) {
                    return usage;
                }
                const what = res[1];
                if (!(what in tests)) {
                    return si.utils.timeoutResolvePromise(
                        `No such test: ${what}<br />Available tests: ${Object.keys(tests)}`,
                    );
                }
                return tests[what]();
            },
            'send': (userLine) => {
                const usage = si.utils.timeoutResolvePromise('Usage: send [command]: [parameters]: [numResp]');
                const res = /send\s+([0-9a-fA-F\s]+)\s*:\s*([0-9a-fA-F\s]+)\s*:\s*([0-9]+)/.exec(userLine);
                if (res === null) {
                    return usage;
                }
                const commandStr = res[1].replace(/\s/g, '');
                if (commandStr.length !== 2) {
                    return si.utils.timeoutResolvePromise(
                        `Command must be one byte, is: ${commandStr}`,
                    );
                }
                const command = parseInt(commandStr, 16);
                const parametersStr = res[2].replace(/\s/g, '');
                if (parametersStr.length % 2 !== 0) {
                    return si.utils.timeoutResolvePromise(
                        `Parameters must be bytes, is: ${parametersStr}`,
                    );
                }
                const parameters = [];
                for (let i = 0; i < parametersStr.length; i += 2) {
                    parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
                }
                const numResp = res.length > 3 ? parseInt(res[3], 10) : 0;
                const mainStation = getSelectedMainStation();
                return mainStation._sendCommand(command, parameters, numResp)
                    .then((respParameters) => `Answer: ${respParameters}`);
            },
            'pipe': (userLine) => {
                const usage = si.utils.timeoutResolvePromise('Usage: pipe [URL]<br />e.g. pipe unix:///tmp/vwin_com1');
                const res = /pipe ([^\s]+)/.exec(userLine);
                if (res === null) {
                    return usage;
                }
                const url = res[1];
                return new Promise((resolve, _reject) => {
                    const mainStation = getSelectedMainStation();
                    const siSimulator = new SiSimulator(url);
                    mainStation.onMessage = (message) => {
                        console.log('MainStation:', message);
                        siSimulator.sendMessage(message);
                    };
                    siSimulator.onMessage = (message) => {
                        console.log('SiSimulator:', message);
                        mainStation.sendMessage(message);
                    };

                    const userInput = $('#mainstation-detail-userinput');
                    userInput.keyup((event) => {
                        if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                            mainStation.onMessage = false;
                            siSimulator.close();
                            resolve('Piping finished.');
                        }
                    });
                });
            },
            'simulate': (userLine) => {
                const usage = si.utils.timeoutResolvePromise('Usage: simulate [what] [URL]<br />e.g. simulate BSM8 unix:///tmp/vwin_com1');
                const res = /simulate ([^\s]+) ([^\s]+)/.exec(userLine);
                if (res === null) {
                    return usage;
                }
                const what = res[1];
                const mainStationStorages = {
                    'BSM8': (
                        '00 02 C1 A1 F7 36 35 36 0E 06 0B 91 98 80 20 C0' +
                        '4B 08 4E FA 28 0E 06 0B 00 36 EE 80 00 00 18 04' +
                        'FF 09 00 00 00 00 00 00 00 00 00 00 4D 70 FF FF' +
                        'FF 00 87 C1 00 00 00 2D 00 00 00 00 FF 00 FB E5' +
                        '00 24 FC 18 FF FF 19 99 0A 3D 7F F8 85 0C 05 01' +
                        '00 00 6F F0 FF FF FF FF 00 00 00 4B FF FF FF FF' +
                        '30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF' +
                        '28 05 0A 31 05 13 01 02 01 87 EE 00 0E 12 00 3C'
                    ),
                };
                const mainStationStorage = mainStationStorages[what];
                if (!mainStationStorage) {
                    const availableDataIdentifiers = Object.keys(mainStationStorages).join(', ');
                    return si.utils.timeoutResolvePromise(
                        `No such SiMainStation data: ${what}\nAvailable data: ${availableDataIdentifiers}`,
                    );
                }
                const mainStationStorageBytes = si.utils.unPrettyHex(mainStationStorage);

                const url = res[2];
                return new Promise((resolve, _reject) => {
                    const siSimulator = new SiSimulator(url);
                    const siMainStationSimulator = new SiMainStationSimulator(mainStationStorageBytes);
                    siSimulator.onMessage = (message) => {
                        console.log('SiSimulator:', message);
                        siMainStationSimulator.sendMessage(message);
                    };
                    siMainStationSimulator.onMessage = (message) => {
                        console.log('SiMainStationSimulator:', message);
                        siSimulator.sendMessage(message);
                    };

                    const userInput = $('#mainstation-detail-userinput');
                    userInput.keyup((event) => {
                        if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                            siSimulator.close();
                            resolve('Simulation finished.');
                        }
                    });
                });
            },
        };

        if ($('#si-quickinfo').length === 0) {
            $('body').append('<div style="position:fixed; width: 100%;"><div style="width: 400px; margin: 20px auto;" id="si-quickinfo"></div></div>');
            $('#si-quickinfo').fadeOut(0, () => {
                $('#si-quickinfo').html('');
            });
        }

        const newDeviceButton = $('#mainstation-add');
        newDeviceButton.on('click', () => {
            si.MainStation.newDevice();
        });

        const updateMainStationList = () => {
            const mainStationList = $('#mainstation-list').html('');
            si.MainStation.all().map((ms) => {
                const isSelected = window.location.hash === `#${ms.device.ident}`;
                const listItem = $(`<div class="mainstation-list-item${isSelected ? ' selected' : ''}">${ms.device.ident}</div>`);
                listItem.on('click', () => {
                    window.location.hash = `#${ms.device.ident}`;
                });
                mainStationList.append(listItem);
            });
        };

        const updateMainStationDetail = () => {
            const selectedMainStation = getSelectedMainStation();
            if (selectedMainStation) {
                selectedMainStation.readInfo().then((info) => {
                    const lines = Object.keys(info)
                        .filter((key) => key[0] !== '_')
                        .map((key) => `<tr><td>${key}</td><td>${info[key]}</td></tr>`);
                    log(`<table>${lines.join('')}</table>`);
                });
            }
            clearLog();
            log('Please wait...');
            const userInput = $('#mainstation-detail-userinput');
            userInput.on('keydown', (e) => {
                if (e.keyCode === 13) {
                    const userLine = userInput.text();
                    logLine(`> ${userLine}`);
                    const command = /^[^\s]+/.exec(userLine);
                    if (command && command[0] in commands) {
                        commands[command[0]](userLine)
                            .then((response) => {
                                logLine(`${response}`);
                            });
                    } else {
                        logLine(`No such command: ${command[0]}<br />Available commands: ${Object.keys(commands)}`);
                    }
                    userInput.html('');
                    e.preventDefault();
                }
            });
            userInput.focus();
        };

        $(window).on('hashchange', () => {
            updateMainStationList();
            updateMainStationDetail();
        });

        setTimeout(() => {
            updateMainStationDetail();
        });

        si.MainStation.onAdded = (ms) => {
            console.log('MainStation added', ms);

            ms.onStateChanged = (state) => {
                if (state === si.MainStation.State.Ready) {
                    ms.beeps(false)
                        .then(() => ms.signal(1));
                }
                console.log('State changed', state);
            };
            updateMainStationList();
            updateMainStationDetail();
        };
        si.MainStation.onRemoved = (ms) => {
            console.log('MainStation removed', ms);
            updateMainStationList();
            updateMainStationDetail();
        };
    };
});
