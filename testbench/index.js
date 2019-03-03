import $ from 'jquery';
import si from '../src/index';
import {commands} from './commands/index';

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

        let userInput = null;
        let userLog = null;

        let commandIsRunning = false;
        const mainHandler = (e) => {
            if (commandIsRunning) {
                return;
            }
            if (e.keyCode === 13) {
                const userLine = userInput.text();
                userInput.html('');
                e.preventDefault();
                logLine(`> ${userLine}`);
                const commandMatch = /^[^\s]+/.exec(userLine);
                const commandName = commandMatch && commandMatch[0];
                if (commandName && commandName in commands) {
                    const commandContext = {
                        userLine: userLine,
                        mainStation: getSelectedMainStation(),
                        userInput: userInput,
                        logLine: logLine,
                    };
                    commandIsRunning = true;
                    commands[commandName](commandContext)
                        .then((response) => {
                            commandIsRunning = false;
                            logLine(`${response}`);
                        }, () => {
                            commandIsRunning = false;
                        });
                } else {
                    logLine(`No such command: ${commandName}<br />Available commands: ${Object.keys(commands)}`);
                }
            }
        };

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

            userLog = $('#mainstation-detail-log');
            userInput = $('#mainstation-detail-userinput');

            userInput.off('keydown', mainHandler);
            userInput.on('keydown', mainHandler);
            userInput.focus();
            userLog.on('click', () => {
                userInput.focus();
            });
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
