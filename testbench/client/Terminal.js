import React from 'react';
import PropTypes from 'prop-types';
import {commands} from './commands';

export const Terminal = (props) => {
    const [logContent, setLogContent] = React.useState([]);
    const [commandIsRunning, setCommandIsRunning] = React.useState(false);
    const logElem = React.useRef();
    const userInputElem = React.useRef();

    React.useEffect(() => {
        logElem.current.scrollTop = logElem.current.scrollHeight;
    }, [logContent]);

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
        if (e.keyCode === 13) {
            const userLine = userInputElem.current.innerHTML || '';
            userInputElem.current.innerHTML = '';
            e.preventDefault();
            logLine(`> ${userLine}`);
            const commandMatch = /^[^\s]+/.exec(userLine);
            const commandName = commandMatch ? commandMatch[0] : '';
            if (commandName && commandName in commands) {
                const commandContext = {
                    userLine: userLine,
                    device: props.selectedDevice,
                    userInput: userInputElem.current,
                    logLine: logLine,
                    logReact: logReact,
                };
                setCommandIsRunning(true);
                commands[commandName](commandContext)
                    .then((response) => {
                        setCommandIsRunning(false);
                        if (response !== undefined) {
                            logLine(`${response}`);
                        }
                    }, () => {
                        setCommandIsRunning(false);
                    });
            } else {
                logLine(`No such command: ${commandName}`);
                logLine(`Available commands: ${Object.keys(commands)}`);
            }
        }
    };

    return (
        <div id='si-device-detail'>
            <div
                id='si-device-detail-log'
                onClick={() => {
                    userInputElem.current.focus();
                }}
                ref={logElem}
            >
                {logContent}
            </div>
            <div
                id='si-device-detail-userinput'
                contentEditable='true'
                onKeyDown={mainHandler}
                ref={userInputElem}
            />
        </div>
    );
};
Terminal.propTypes = {
    selectedDevice: PropTypes.object,
};
