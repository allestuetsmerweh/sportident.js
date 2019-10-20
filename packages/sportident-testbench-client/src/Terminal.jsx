import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {getSiShellCommands, Shell} from 'sportident-testbench-shell/lib';
//
// const maxHistory = 100;
//
// const getCommand = (parameters, context) => {
//     const commandClass = commands[parameters[0]];
//     if (!commandClass) {
//         return undefined;
//     }
//     return new commandClass(context);
// };
//
// const autocomplete = (parameters) => {
//     const command = commands[parameters[0]];
//     if (command) {
//         const suggestions = command.autocomplete(parameters.slice(1));
//         return suggestions.map((suggestion) => [parameters[0], ...suggestion].join(' '));
//     }
//     if (parameters.length > 1) {
//         return parameters.join(' ');
//     }
//     const commandNames = Object.keys(commands)
//         .filter((commandName) => commandName.startsWith(parameters[0]));
//     return commandNames;
// };
//
// const getCommonPrefix = (strings) => strings.reduce((accumulator, value) => {
//     const maxLength = Math.min(accumulator.length, value.length);
//     let commonSoFar = true;
//     return _.range(maxLength).map((index) => {
//         if (!commonSoFar) {
//             return '';
//         }
//         if (accumulator.charAt(index) === value.charAt(index)) {
//             return accumulator.charAt(index);
//         }
//         commonSoFar = false;
//         return '';
//     }).join('');
// });

const keyCodeFromDomEventKey = (domKey) => {
    switch (domKey) {
        case 'Backspace': return 8;
        case 'Enter': return 13;
        case 'Escape': return undefined;
        case 'Shift': return undefined;
        case 'Tab': return 9;
        default: {
            if (domKey.length === 1) {
                return domKey.charCodeAt(0);
            }
            console.warn(`Undefined Special Key: ${domKey}`);
            return undefined;
        }
    };
}

const TerminalCursor = () => {
    const [shown, setIsShown] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsShown((oldIsShown) => !oldIsShown);
        }, 500);
        return () => {
            clearInterval(interval);
        }
    }, []);
    return shown ? '\u2588' : ' ';
};

export const Terminal = (props) => {
    const [shellContent, setShellContent] = React.useState('');
    const [inputQueue, setInputQueue] = React.useState([]);
    const [outputQueue, setOutputQueue] = React.useState([]);
    const terminalElem = React.useRef();
    // const [commandIsRunning, setCommandIsRunning] = React.useState(false);
    // const [history, setHistory] = React.useState([]);
    // const logElem = React.useRef();
    // const userInputElem = React.useRef();
    // const historyKey = `history-${props.selectedDevice ? props.selectedDevice.ident : ''}`;
    // let historyIndex = 0;

    // const getParameters = () => {
    //     const userLine = userInputElem.current.value || '';
    //     return userLine.split(/\s+/);
    // };
    //
    // const addToHistory = (commandStr) => {
    //     const newHistory = [
    //         ...history.filter((historyEntry) => historyEntry !== commandStr),
    //         commandStr,
    //     ];
    //     while (newHistory.length > maxHistory) {
    //         newHistory.shift();
    //     }
    //     setHistory(newHistory);
    //     window.localStorage.setItem(historyKey, JSON.stringify(newHistory));
    // };
    //
    // const updateHistoryInput = () => {
    //     const newValue = historyIndex === 0 ? '' : history[history.length - historyIndex];
    //     userInputElem.current.value = newValue;
    // };

    React.useEffect(() => {
        terminalElem.current.scrollTop = terminalElem.current.scrollHeight;
    }, [shellContent]);

    // React.useEffect(() => {
    //     try {
    //         const newHistory = JSON.parse(window.localStorage.getItem(historyKey));
    //         if (_.isArray(newHistory)) {
    //             setHistory(newHistory);
    //         }
    //     } catch (exc) {
    //         // do nothing
    //     }
    // }, [historyKey]);

    React.useEffect(() => {
        terminalElem.current.focus();
    }, []);

    // const logReact = (newContent) => setLogContent((prevLogContent) => [
    //     ...prevLogContent,
    //     <span key={`log-entry-${prevLogContent.length}`}>{newContent}</span>,
    // ]);
    // const logLine = (text) => logReact(<div>{text}</div>);

    // const mainHandler = (e) => {
    //     if (commandIsRunning) {
    //         return;
    //     }
    //     if (e.keyCode === 13) { // Enter
    //         const parameters = getParameters();
    //         const commandContext = {
    //             commandName: parameters[0],
    //             parameters: parameters.slice(1),
    //             device: props.selectedDevice,
    //             userInput: userInputElem.current,
    //             logLine: logLine,
    //             logReact: logReact,
    //         };
    //         const command = getCommand(parameters, commandContext);
    //         userInputElem.current.value = '';
    //         e.preventDefault();
    //         logLine(`> ${parameters.join(' ')}`);
    //         if (command) {
    //             setCommandIsRunning(true);
    //             command.safelyExecute()
    //                 .then((response) => {
    //                     setCommandIsRunning(false);
    //                     addToHistory(parameters.join(' '));
    //                     if (response !== undefined) {
    //                         logLine(`${response}`);
    //                     }
    //                 })
    //                 .catch((exc) => {
    //                     console.warn(exc);
    //                     logReact(<div className='error-message'>{exc.message}</div>);
    //                     command.printUsage();
    //                     setCommandIsRunning(false);
    //                 });
    //         } else {
    //             logLine(`No such command: ${parameters[0]}`);
    //             logLine(`Available commands: ${Object.keys(commands)}`);
    //         }
    //     } else if (e.keyCode === 9) { // Tab
    //         const parameters = getParameters();
    //         const possibilities = autocomplete(parameters);
    //         if (possibilities.length === 1) {
    //             userInputElem.current.value = possibilities[0];
    //         } else if (possibilities.length > 1) {
    //             userInputElem.current.value = getCommonPrefix(possibilities);
    //         }
    //         e.preventDefault();
    //         e.stopPropagation();
    //     } else if (e.keyCode === 38) { // Arrow up
    //         historyIndex += 1;
    //         if (historyIndex > history.length) {
    //             historyIndex = history.length;
    //         }
    //         updateHistoryInput();
    //     } else if (e.keyCode === 40) { // Arrow down
    //         historyIndex -= 1;
    //         if (historyIndex < 0) {
    //             historyIndex = 0;
    //         }
    //         updateHistoryInput();
    //     }
    // };

    const onKeyDown = React.useCallback((event) => {
        if (!event.key || event.ctrlKey) {
            return;
        }
        event.preventDefault();
        const keyCode = keyCodeFromDomEventKey(event.key);
        if (keyCode === undefined) {
            return;
        }
        setInputQueue([...inputQueue, keyCode]);
    }, [inputQueue]);

    const appendToShellContent = (charCode) => {
        switch (charCode) {
            case 8: {
                const contentLength = shellContent.length;
                const toDelete = shellContent.charCodeAt(contentLength - 1);
                if (toDelete === 10 || toDelete === 13) {
                    return;
                }
                const newContent = shellContent.substr(0, contentLength - 1);
                return setShellContent(newContent);
            }
            default: {
                const newChar = String.fromCharCode(charCode);
                const newContent = `${shellContent}${newChar}`;
                return setShellContent(newContent);
            }
        }
    };

    if (outputQueue.length > 0) {
        const charCode = outputQueue[0];
        setOutputQueue(outputQueue.splice(1));
        appendToShellContent(charCode);
    }

    const pushToOutputQueue = (charCode) => {
        setOutputQueue((outputQueue) => [...outputQueue, charCode]);
    };

    const popFromInputQueue = React.useCallback(() => {
        if (inputQueue.length === 0) {
            return undefined;
        }
        const charCode = inputQueue[0];
        setInputQueue(inputQueue.slice(1));
        return charCode;
    }, [inputQueue]);

    const siShell = React.useMemo(() => new Shell(
        {
            getChar: () => undefined,
            putChar: (char) => pushToOutputQueue(char),
        },
        getSiShellCommands(),
        {
            initialEnv: {device: props.selectedDevice},
        }
    ), []);

    siShell.ui = {
        getChar: () => popFromInputQueue(),
        putChar: (char) => pushToOutputQueue(char),
    };

    React.useEffect(() => {
        siShell.run();
        return () => {
            // TODO: Somehow close the shell
            console.warn('CLOSE SHELL');
        };
    }, []);

    const shellLines = shellContent.split(/[\n\r]+/);
    return (
        <div
            id='si-terminal'
            className='terminal'
            onKeyDown={onKeyDown}
            ref={terminalElem}
            tabIndex={-1}
        >
            {shellLines.map((line, index) => {
                const cursor = index === shellLines.length - 1
                    && <TerminalCursor />;
                return <div key={`line-${index}`}>{line}{cursor}</div>;
            })}
        </div>
    );
};
Terminal.propTypes = {
    selectedDevice: PropTypes.object,
};
