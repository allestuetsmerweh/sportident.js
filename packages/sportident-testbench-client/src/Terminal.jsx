import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {commands} from './commands';

const maxHistory = 100;

const getCommand = (parameters, context) => {
    const commandClass = commands[parameters[0]];
    if (!commandClass) {
        return undefined;
    }
    return new commandClass(context);
};

const autocomplete = (parameters) => {
    const command = commands[parameters[0]];
    if (command) {
        const suggestions = command.autocomplete(parameters.slice(1));
        return suggestions.map((suggestion) => [parameters[0], ...suggestion].join(' '));
    }
    if (parameters.length > 1) {
        return parameters.join(' ');
    }
    const commandNames = Object.keys(commands)
        .filter((commandName) => commandName.startsWith(parameters[0]));
    return commandNames;
};

const getCommonPrefix = (strings) => strings.reduce((accumulator, value) => {
    const maxLength = Math.min(accumulator.length, value.length);
    let commonSoFar = true;
    return _.range(maxLength).map((index) => {
        if (!commonSoFar) {
            return '';
        }
        if (accumulator.charAt(index) === value.charAt(index)) {
            return accumulator.charAt(index);
        }
        commonSoFar = false;
        return '';
    }).join('');
});

export const Terminal = (props) => {
    const [logContent, setLogContent] = React.useState([]);
    const [commandIsRunning, setCommandIsRunning] = React.useState(false);
    const [history, setHistory] = React.useState([]);
    const logElem = React.useRef();
    const userInputElem = React.useRef();
    const historyKey = `history-${props.selectedDevice ? props.selectedDevice.ident : ''}`;
    let historyIndex = 0;

    const getParameters = () => {
        const userLine = userInputElem.current.value || '';
        return userLine.split(/\s+/);
    };

    const addToHistory = (commandStr) => {
        const newHistory = [
            ...history.filter((historyEntry) => historyEntry !== commandStr),
            commandStr,
        ];
        while (newHistory.length > maxHistory) {
            newHistory.shift();
        }
        setHistory(newHistory);
        window.localStorage.setItem(historyKey, JSON.stringify(newHistory));
    };

    const updateHistoryInput = () => {
        const newValue = historyIndex === 0 ? '' : history[history.length - historyIndex];
        userInputElem.current.value = newValue;
    };

    React.useEffect(() => {
        logElem.current.scrollTop = logElem.current.scrollHeight;
    }, [logContent]);

    React.useEffect(() => {
        try {
            const newHistory = JSON.parse(window.localStorage.getItem(historyKey));
            if (_.isArray(newHistory)) {
                setHistory(newHistory);
            }
        } catch (exc) {
            // do nothing
        }
    }, [historyKey]);

    React.useEffect(() => {
        userInputElem.current.focus();
    }, []);

    const logReact = (newContent) => setLogContent((prevLogContent) => [
        ...prevLogContent,
        <span key={`log-entry-${prevLogContent.length}`}>{newContent}</span>,
    ]);
    const logLine = (text) => logReact(<div>{text}</div>);

    const mainHandler = (e) => {
        if (commandIsRunning) {
            return;
        }
        if (e.keyCode === 13) { // Enter
            const parameters = getParameters();
            const commandContext = {
                commandName: parameters[0],
                parameters: parameters.slice(1),
                device: props.selectedDevice,
                userInput: userInputElem.current,
                logLine: logLine,
                logReact: logReact,
            };
            const command = getCommand(parameters, commandContext);
            userInputElem.current.value = '';
            e.preventDefault();
            logLine(`> ${parameters.join(' ')}`);
            if (command) {
                setCommandIsRunning(true);
                command.safelyExecute()
                    .then((response) => {
                        setCommandIsRunning(false);
                        addToHistory(parameters.join(' '));
                        if (response !== undefined) {
                            logLine(`${response}`);
                        }
                    })
                    .catch((exc) => {
                        console.warn(exc);
                        logReact(<div className='error-message'>{exc.message}</div>);
                        command.printUsage();
                        setCommandIsRunning(false);
                    });
            } else {
                logLine(`No such command: ${parameters[0]}`);
                logLine(`Available commands: ${Object.keys(commands)}`);
            }
        } else if (e.keyCode === 9) { // Tab
            const parameters = getParameters();
            const possibilities = autocomplete(parameters);
            if (possibilities.length === 1) {
                userInputElem.current.value = possibilities[0];
            } else if (possibilities.length > 1) {
                userInputElem.current.value = getCommonPrefix(possibilities);
            }
            e.preventDefault();
            e.stopPropagation();
        } else if (e.keyCode === 38) { // Arrow up
            historyIndex += 1;
            if (historyIndex > history.length) {
                historyIndex = history.length;
            }
            updateHistoryInput();
        } else if (e.keyCode === 40) { // Arrow down
            historyIndex -= 1;
            if (historyIndex < 0) {
                historyIndex = 0;
            }
            updateHistoryInput();
        }
    };

    return (
        <div id='si-device-detail'>
            <div
                id='si-device-detail-log'
                onClick={() => {
                    userInputElem.current.select();
                }}
                ref={logElem}
            >
                {logContent}
            </div>
            <div id='si-device-detail-userinput-container'>
                <input
                    id='si-device-detail-userinput'
                    onKeyDown={mainHandler}
                    ref={userInputElem}
                />
            </div>
        </div>
    );
};
Terminal.propTypes = {
    selectedDevice: PropTypes.object,
};
