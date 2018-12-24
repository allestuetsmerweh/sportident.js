/* global si, $ */

si.onLoad = () => {
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
                                logLine(`${actionName} ${card.type()} succeeded: ${card.cardNumber}`);
                                setTimeout(resolve, 1);
                            } else {
                                logLine(`Other ${card.type()}: ${card.cardNumber}`);
                            }
                        };
                    });
                });
            const punchAnother = (mode, code, actionName) => () => mainStation.code(code)
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
                                logLine(`${actionName} ${card.type()}: ${card.cardNumber} (please punch another card)`);
                            } else {
                                logLine(`Other ${card.type()} succeeded: ${card.cardNumber}`);
                                setTimeout(resolve, 1);
                            }
                        };
                    });
                });
            const readoutCard = (sampleIdent) => () => mainStation.autoSend(0)
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
                                samples[sampleIdent] = card.toDict();
                                logLine(card.toHtml());
                                mainStation.onCardRemoved = (_card) => {
                                    setTimeout(resolve, 1);
                                };
                            } else {
                                logLine(`Other ${card.type()}: ${card.cardNumber}`);
                            }
                        };
                    });
                });
            return simulateStation(si.Station.Mode.Clear, 1, 'Clear')()
                .then(readoutCard('clear'))
                .then(simulateStation(si.Station.Mode.Check, 2, 'Check'))
                .then(readoutCard('clear-check'))
                .then(simulateStation(si.Station.Mode.Start, 3, 'Start'))
                .then(readoutCard('clear-check-start'))
                .then(simulateStation(si.Station.Mode.Clear, 4, 'Clear'))
                .then(punchAnother(si.Station.Mode.Control, 31, 'Punch 31'))
                .then(simulateStation(si.Station.Mode.Control, 31, 'Punch 31'))
                .then(readoutCard('clear-31'))
                .then(simulateStation(si.Station.Mode.Control, 32, 'Punch 32'))
                .then(simulateStation(si.Station.Mode.Control, 33, 'Punch 33'))
                .then(simulateStation(si.Station.Mode.Control, 34, 'Punch 34'))
                .then(simulateStation(si.Station.Mode.Control, 35, 'Punch 35'))
                .then(simulateStation(si.Station.Mode.Control, 36, 'Punch 36'))
                .then(simulateStation(si.Station.Mode.Control, 37, 'Punch 37'))
                .then(simulateStation(si.Station.Mode.Control, 38, 'Punch 38'))
                .then(simulateStation(si.Station.Mode.Control, 39, 'Punch 39'))
                .then(simulateStation(si.Station.Mode.Control, 40, 'Punch 40'))
                .then(simulateStation(si.Station.Mode.Control, 41, 'Punch 41'))
                .then(simulateStation(si.Station.Mode.Control, 42, 'Punch 42'))
                .then(simulateStation(si.Station.Mode.Control, 43, 'Punch 43'))
                .then(simulateStation(si.Station.Mode.Control, 44, 'Punch 44'))
                .then(simulateStation(si.Station.Mode.Control, 45, 'Punch 45'))
                .then(simulateStation(si.Station.Mode.Control, 46, 'Punch 46'))
                .then(simulateStation(si.Station.Mode.Control, 47, 'Punch 47'))
                .then(simulateStation(si.Station.Mode.Control, 48, 'Punch 48'))
                .then(simulateStation(si.Station.Mode.Control, 49, 'Punch 49'))
                .then(simulateStation(si.Station.Mode.Control, 50, 'Punch 50'))
                .then(simulateStation(si.Station.Mode.Control, 51, 'Punch 51'))
                .then(simulateStation(si.Station.Mode.Control, 52, 'Punch 52'))
                .then(simulateStation(si.Station.Mode.Control, 53, 'Punch 53'))
                .then(simulateStation(si.Station.Mode.Control, 54, 'Punch 54'))
                .then(simulateStation(si.Station.Mode.Control, 55, 'Punch 55'))
                .then(simulateStation(si.Station.Mode.Control, 56, 'Punch 56'))
                .then(simulateStation(si.Station.Mode.Control, 57, 'Punch 57'))
                .then(simulateStation(si.Station.Mode.Control, 58, 'Punch 58'))
                .then(simulateStation(si.Station.Mode.Control, 59, 'Punch 59'))
                .then(simulateStation(si.Station.Mode.Control, 60, 'Punch 60'))
                .then(simulateStation(si.Station.Mode.Control, 61, 'Punch 61'))
                .then(simulateStation(si.Station.Mode.Control, 62, 'Punch 62'))
                .then(simulateStation(si.Station.Mode.Control, 63, 'Punch 63'))
                .then(simulateStation(si.Station.Mode.Control, 64, 'Punch 64'))
                .then(simulateStation(si.Station.Mode.Control, 65, 'Punch 65'))
                .then(simulateStation(si.Station.Mode.Control, 66, 'Punch 66'))
                .then(simulateStation(si.Station.Mode.Control, 67, 'Punch 67'))
                .then(simulateStation(si.Station.Mode.Control, 68, 'Punch 68'))
                .then(simulateStation(si.Station.Mode.Control, 69, 'Punch 69'))
                .then(simulateStation(si.Station.Mode.Control, 70, 'Punch 70'))
                .then(readoutCard('clear-[31-70]'))
                .then(() => {
                    logLine('Finished!');
                    console.log('SAMPLES', samples);
                });
        },
    };

    const commands = {
        'test': (userLine) => {
            const usage = si.timeoutResolvePromise('Usage: test [what]');
            const res = /test ([^\s]+)/.exec(userLine);
            if (res === null) {
                return usage;
            }
            const what = res[1];
            if (!(what in tests)) {
                return si.timeoutResolvePromise(
                    `No such test: ${what}<br />Available tests: ${Object.keys(tests)}`,
                );
            }
            return tests[what]();
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
        selectedMainStation.readInfo().then((info) => {
            const lines = Object.keys(info)
                .filter((key) => key[0] !== '_')
                .map((key) => `<tr><td>${key}</td><td>${info[key]}</td></tr>`);
            log(`<table>${lines.join('')}</table>`);
        });
        clearLog();
        log('Please wait...');
        const userInput = $('#mainstation-detail-userinput');
        userInput.on('keydown', (e) => {
            if (e.keyCode === 13) {
                const userLine = userInput.text();
                logLine(`> ${userLine}`);
                const command = /^[^\s]+/.exec(userLine);
                if (command[0] in commands) {
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
